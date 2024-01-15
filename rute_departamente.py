from flask import request, render_template, session, flash, redirect, url_for, jsonify
from baza_de_date import mysql

def init_departamente_routes(app):
    @app.route('/formular_adauga_departament', methods=['GET'])
    def formular_adauga_departament():
        # Verificare autentificare pentru access pagina
        if 'logged_in' not in session:
            flash('Vă rugăm să vă logați pentru a accesa această pagină.', 'danger')
            return redirect(url_for('login'))
        return render_template('adauga_departament.html')

    @app.route('/get_departamente', methods=['GET'])
    def get_departamente():
        try:
            # Parametri paginare
            page = request.args.get('page', 1, type=int)
            per_page = request.args.get('per_page', 10, type=int)
            facultate = request.args.get('facultate', '')
            offset = (page - 1) * per_page

            cur = mysql.connection.cursor()

            # Construire query in functie de filtrare DB
            query_base = "SELECT d.*, CONCAT(p.nume, ' ', p.prenume) AS sef_departament FROM departamente d LEFT JOIN profesori p ON d.sef_departament = p.id_profesor"
            if facultate:
                query_base += " WHERE d.facultate = %s"

            query_limit = " LIMIT %s OFFSET %s"
            query = query_base + query_limit

            # Executare query cu sau fara filtrare DB
            if facultate:
                cur.execute(query, (facultate, per_page, offset))
            else:
                cur.execute(query, (per_page, offset))

            departamente = cur.fetchall()

            # Calculare numar total pentru paginare
            if facultate:
                cur.execute("SELECT COUNT(*) as total FROM departamente WHERE facultate = %s", (facultate,))
            else:
                cur.execute("SELECT COUNT(*) as total FROM departamente")
            total_departamente = cur.fetchone()['total']

            return jsonify({'departamente': departamente, 'total': total_departamente})
        except Exception as e:
            return jsonify({'error': str(e)}), 500
        finally:
            cur.close()

    @app.route('/adauga_departament', methods=['POST'])
    def adauga_departament():
        data = request.get_json()
        sef_departament_id = data.get('sef_departament')
        try:
            cursor = mysql.connection.cursor()
            
            # Obtinere nume sef departament
            nume_sef = ""
            if sef_departament_id:
                cursor.execute("SELECT nume, prenume FROM profesori WHERE id_profesor = %s", (sef_departament_id,))
                profesor = cursor.fetchone()
                if profesor:
                    nume_sef = f"{profesor['nume']} {profesor['prenume']}"

            # Adaugare departament in baza de date
            cursor.execute("INSERT INTO departamente (facultate, nume_departament, sef_departament, cod_unic, specializari) VALUES (%s, %s, %s, %s, %s)",
                        (data['facultate'], data['nume_departament'], nume_sef, data['cod_unic'], data['specializari']))
            mysql.connection.commit()
            return jsonify({'message': 'Departament adăugat cu succes'})
        except Exception as e:
            mysql.connection.rollback()
            return jsonify({'error': str(e)}), 500
        finally:
            cursor.close()

    @app.route('/get_departament/<int:id_departament>', methods=['GET'])
    def get_departament(id_departament):
        try:
            cursor = mysql.connection.cursor()
            # Obtinere departament cu join pentru nume sef
            cursor.execute("""
                SELECT d.*, CONCAT(p.nume, ' ', p.prenume) AS nume_sef, p.id_profesor AS id_sef 
                FROM departamente d 
                LEFT JOIN profesori p ON d.sef_departament = CONCAT(p.nume, ' ', p.prenume) 
                WHERE d.id_departament = %s
            """, (id_departament,))
            departament = cursor.fetchone()
            
            if departament:
                return jsonify(departament)
            else:
                return jsonify({'message': 'Departamentul nu a fost găsit'}), 404
        except Exception as e:
            return jsonify({'error': str(e)}), 500
        finally:
            cursor.close()

    @app.route('/update_departament/<int:id_departament>', methods=['POST'])
    def update_departament(id_departament):
        data = request.get_json()
        sef_departament_id = data.get('sef_departament')

        try:
            cursor = mysql.connection.cursor()
            
            # Obtinere nume sef departament actualizat
            nume_sef = ""
            if sef_departament_id:
                cursor.execute("SELECT nume, prenume FROM profesori WHERE id_profesor = %s", (sef_departament_id,))
                profesor = cursor.fetchone()
                if profesor:
                    nume_sef = f"{profesor['nume']} {profesor['prenume']}"

            # Actualizare departament in baza de date
            cursor.execute(
                "UPDATE departamente SET facultate = %s, nume_departament = %s, sef_departament = %s, cod_unic = %s, specializari = %s WHERE id_departament = %s",
                (data['facultate'], data['nume_departament'], nume_sef, data['cod_unic'], data['specializari'],
                id_departament))
            mysql.connection.commit()
            return jsonify({'message': 'Departament actualizat cu succes'})
        except Exception as e:
            mysql.connection.rollback()
            return jsonify({'error': str(e)}), 500
        finally:
            cursor.close()

    @app.route('/sterge_departament/<int:id_departament>', methods=['DELETE'])
    def sterge_departament(id_departament):
        try:
            cursor = mysql.connection.cursor()
            # Stergere departament din baza de date
            cursor.execute("DELETE FROM departamente WHERE id_departament = %s", (id_departament,))
            mysql.connection.commit()
            return jsonify({'message': 'Departament șters cu succes'})
        except Exception as e:
            mysql.connection.rollback()
            return jsonify({'error': str(e)}), 500
        finally:
            cursor.close()