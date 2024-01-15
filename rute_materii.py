from flask import request, render_template, session, flash, redirect, url_for, jsonify
import json
from baza_de_date import mysql

def init_materii_routes(app):
    @app.route('/formular_adauga_materii', methods=['GET'])
    def formular_adauga_materii():
        # Verificare autentificare pentru acces pagina
        if 'logged_in' not in session:
            flash('Vă rugăm să vă logați pentru a accesa această pagină.', 'danger')
            return redirect(url_for('login'))
        return render_template('adauga_materii.html')

    @app.route('/get_materii', methods=['GET'])
    def get_materii():
        # Parametri paginare
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 10, type=int)
        offset = (page - 1) * per_page

        cur = mysql.connection.cursor()

        # Obtinere numar total materii
        cur.execute("SELECT COUNT(*) AS total FROM materii")
        result = cur.fetchone()
        total_materii = result['total'] if result else 0
        total_pages = (total_materii + per_page - 1) // per_page

        # Obtinere materii cu join pentru date asociate
        cur.execute("""
            SELECT 
                m.id_materie, 
                m.nume_materie, 
                m.tip_ore, 
                CONCAT(p.nume, ' ', p.prenume) AS nume_profesor, 
                g.cod_grupa, 
                m.an, 
                m.semestru, 
                m.cod,
                m.profesor_curs,
                m.profesor_laborator,
                m.profesor_seminar,
                m.profesor_proiect
            FROM materii m
            LEFT JOIN profesori p ON m.id_profesor = p.id_profesor
            LEFT JOIN grupuri g ON m.id_grupa = g.id_grupa
            LIMIT %s OFFSET %s
            """, (per_page, offset))
        materii = cur.fetchall()

        cur.close()
        return jsonify({'materii': materii, 'total_pages': total_pages, 'current_page': page})

    @app.route('/adauga_materie', methods=['POST'])
    def adauga_materie():
        data = request.get_json()
        nume_materie = data['nume_materie']
        tip_ore = data['tip_ore']
        id_grupa = data['id_grupa']
        an = data['an']
        semestru = data['semestru']
        cod = data.get('cod', '')

        cur = mysql.connection.cursor()
        # Procesare tip_ore pentru stocare
        if isinstance(tip_ore, dict):
            tip_ore = json.dumps(tip_ore)
        
        # Functie pentru obtinere nume profesor
        def get_nume_profesor(id_profesor):
            if not id_profesor:
                return None
            cur.execute("SELECT CONCAT(nume, ' ', prenume) AS nume_complet FROM profesori WHERE id_profesor = %s", (id_profesor,))
            result = cur.fetchone()
            return result['nume_complet'] if result else None

        # Obtinere nume profesori pentru fiecare tip activitate
        profesor_curs = get_nume_profesor(data.get('profesor_curs'))
        profesor_laborator = get_nume_profesor(data.get('profesor_laborator'))
        profesor_seminar = get_nume_profesor(data.get('profesor_seminar'))
        profesor_proiect = get_nume_profesor(data.get('profesor_proiect'))

        # Adaugare materie in baza de date
        try:
            cur.execute("""
                INSERT INTO materii (nume_materie, tip_ore, id_grupa, an, semestru, cod, profesor_curs, profesor_laborator, profesor_seminar, profesor_proiect)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                """, (nume_materie, tip_ore, id_grupa, an, semestru, cod, profesor_curs, profesor_laborator, profesor_seminar, profesor_proiect))
            mysql.connection.commit()
            return jsonify({'message': 'Materie adăugată cu succes'})
        except Exception as e:
            mysql.connection.rollback()
            return jsonify({'error': str(e)}), 500
        finally:
            cur.close()

    @app.route('/update_materie/<int:id_materie>', methods=['POST'])
    def update_materie(id_materie):
        data = request.get_json()
        nume_materie = data['nume_materie']
        tip_ore = data['tip_ore']
        # Procesare tip_ore pentru stocare
        if isinstance(tip_ore, dict):
            tip_ore = json.dumps(tip_ore)
        id_grupa = data['id_grupa']
        an = data['an']
        semestru = data['semestru']
        cod = data.get('cod', '')

        profesor_curs = data.get('profesor_curs', '')
        profesor_laborator = data.get('profesor_laborator', '')
        profesor_seminar = data.get('profesor_seminar', '')
        profesor_proiect = data.get('profesor_proiect', '')

        cur = mysql.connection.cursor()
        try:
            # Actualizare materie in baza de date
            cur.execute("""
                UPDATE materii 
                SET nume_materie = %s, tip_ore = %s, id_grupa = %s, an = %s, semestru = %s, cod = %s, 
                    profesor_curs = %s, profesor_laborator = %s, profesor_seminar = %s, profesor_proiect = %s 
                WHERE id_materie = %s
                """, (nume_materie, tip_ore, id_grupa, an, semestru, cod, profesor_curs, profesor_laborator, profesor_seminar, profesor_proiect, id_materie))
            mysql.connection.commit()
            return jsonify({'message': 'Materie actualizată cu succes'})
        except Exception as e:
            mysql.connection.rollback()
            return jsonify({'error': str(e)}), 500
        finally:
            cur.close()

    @app.route('/sterge_materie/<int:id_materie>', methods=['DELETE'])
    def sterge_materie(id_materie):
        cur = mysql.connection.cursor()
        try:
            # Stergere materie din baza de date
            cur.execute("DELETE FROM materii WHERE id_materie = %s", (id_materie,))
            mysql.connection.commit()
            return jsonify({'message': 'Materie ștearsă cu succes'})
        except Exception as e:
            mysql.connection.rollback()
            return jsonify({'error': str(e)}), 500
        finally:
            cur.close()

    @app.route('/get_materie/<int:id_materie>', methods=['GET'])
    def get_materie(id_materie):
        cur = mysql.connection.cursor()
        # Obtinere materie specificata
        cur.execute("SELECT * FROM materii WHERE id_materie = %s", (id_materie,))
        materie = cur.fetchone()
        cur.close()

        if materie:
            # Procesare camp tip_ore
            try:
                materie['tip_ore'] = json.loads(materie['tip_ore']) if materie['tip_ore'] else {}
            except:
                materie['tip_ore'] = {}
            return jsonify(materie)
        else:
            return jsonify({'message': 'Materia nu a fost găsită'}), 404