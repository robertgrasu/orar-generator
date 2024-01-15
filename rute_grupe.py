from flask import request, render_template, session, flash, redirect, url_for, jsonify
from baza_de_date import mysql

def init_grupe_routes(app):
    @app.route('/formular_adauga_grupe', methods=['GET'])
    def formular_adauga_grupe():
        # Verificare autentificare pentru acces pagina
        if 'logged_in' not in session:
            flash('Vă rugăm să vă logați pentru a accesa această pagină.', 'danger')
            return redirect(url_for('login'))
        return render_template('adauga_grupe.html')

    @app.route('/get_specializari', methods=['GET'])
    def get_specializari():
        try:
            cur = mysql.connection.cursor()
            # Extragere si procesare specializari din departamente
            cur.execute("SELECT specializari FROM departamente")
            specializari = cur.fetchall()
            specializari_unice = set()
            for spec in specializari:
                if 'specializari' in spec and spec['specializari']:
                    for s in spec['specializari'].split(', '):
                        specializari_unice.add(s.strip())
            return jsonify(list(specializari_unice))
        except Exception as e:
            return jsonify({'error': str(e)}), 500
        finally:
            cur.close()

    @app.route('/adauga_grupa', methods=['POST'])
    def adauga_grupa():
        data = request.get_json()
        try:
            cur = mysql.connection.cursor()

            # Obtinere nume departament din id
            cur.execute("SELECT nume_departament FROM departamente WHERE id_departament = %s", (data['departament'],))
            departament = cur.fetchone()
            if departament:
                nume_departament = departament['nume_departament']
            else:
                return jsonify({'error': 'Departamentul nu a fost găsit'}), 404

            # Adaugare grupa in baza de date
            cur.execute(
                "INSERT INTO grupuri (cod_grupa, id_departament, nume_departament, facultate, specializare, an_studiu, numar_studenti, studenti_buget, studenti_taxa) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)",
                (data['cod_grupa'], data['departament'], nume_departament, data['facultate'], data['specializare'],
                 data['an_studiu'], data['numar_studenti'], data['studenti_buget'], data['studenti_taxa']))
            mysql.connection.commit()
            return jsonify({'message': 'Grupa adaugata cu succes'})
        except Exception as e:
            mysql.connection.rollback()
            return jsonify({'error': str(e)}), 500
        finally:
            cur.close()

    @app.route('/get_grupuri', methods=['GET'])
    def get_grupuri():
        try:
            # Parametri paginare
            page = request.args.get('page', 1, type=int)
            per_page = request.args.get('per_page', 10, type=int)
            offset = (page - 1) * per_page

            cur = mysql.connection.cursor()
            # Obtinere grupe paginat
            cur.execute("SELECT * FROM grupuri LIMIT %s OFFSET %s", (per_page, offset))
            grupuri = cur.fetchall()

            # Obtinere numar total grupe pentru paginare
            cur.execute("SELECT COUNT(*) as total FROM grupuri")
            total_grupuri = cur.fetchone()['total']

            return jsonify({'grupuri': grupuri, 'total': total_grupuri, 'pagina_curenta': page, 'per_page': per_page})
        except Exception as e:
            return jsonify({'error': str(e)}), 500
        finally:
            cur.close()

    @app.route('/get_grupa/<int:id_grupa>', methods=['GET'])
    def get_grupa(id_grupa):
        try:
            cur = mysql.connection.cursor()
            # Obtinere grupa specificata
            cur.execute("SELECT * FROM grupuri WHERE id_grupa = %s", (id_grupa,))
            grupa = cur.fetchone()
            if grupa:
                return jsonify(grupa)
            else:
                return jsonify({'error': 'Grupa nu a fost găsită'}), 404
        except Exception as e:
            return jsonify({'error': str(e)}), 500
        finally:
            cur.close()

    @app.route('/update_grupa/<int:id_grupa>', methods=['POST'])
    def update_grupa(id_grupa):
        data = request.get_json()
        try:
            cur = mysql.connection.cursor()

            # Obtinere nume departament actualizat
            cur.execute("SELECT nume_departament FROM departamente WHERE id_departament = %s", (data['departament'],))
            departament = cur.fetchone()
            if departament:
                nume_departament = departament['nume_departament']
            else:
                return jsonify({'error': 'Departamentul nu a fost găsit'}), 404

            # Actualizare grupa in baza de date
            cur.execute("""
                UPDATE grupuri 
                SET cod_grupa = %s, 
                    id_departament = %s, 
                    nume_departament = %s, 
                    facultate = %s, 
                    specializare = %s, 
                    an_studiu = %s, 
                    numar_studenti = %s, 
                    studenti_buget = %s, 
                    studenti_taxa = %s 
                WHERE id_grupa = %s
                """, (data['cod_grupa'], data['departament'], nume_departament, data['facultate'], data['specializare'],
                      data['an_studiu'], data['numar_studenti'], data['studenti_buget'],
                      data['studenti_taxa'], id_grupa))

            mysql.connection.commit()
            return jsonify({'message': 'Grupa actualizata cu succes'})
        except Exception as e:
            mysql.connection.rollback()
            return jsonify({'error': str(e)}), 500
        finally:
            cur.close()

    @app.route('/sterge_grupa/<int:id_grupa>', methods=['DELETE'])
    def sterge_grupa(id_grupa):
        try:
            cur = mysql.connection.cursor()
            # Stergere grupa din baza de date
            cur.execute("DELETE FROM grupuri WHERE id_grupa=%s", (id_grupa,))
            mysql.connection.commit()
            return jsonify({'message': 'Grupa stearsa cu succes'})
        except Exception as e:
            mysql.connection.rollback()
            return jsonify({'error': str(e)}), 500
        finally:
            cur.close()