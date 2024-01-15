from flask import request, render_template, session, flash, redirect, url_for, jsonify
from baza_de_date import mysql

def init_profesori_routes(app):
    @app.route('/formular_adauga_profesori', methods=['GET'])
    def formular_adauga_profesori():
        # Verificare autentificare pentru acces pagina
        if 'logged_in' not in session:
            flash('Vă rugăm să vă logați pentru a accesa această pagină.', 'danger')
            return redirect(url_for('login'))
        return render_template('adauga_profesor.html')

    @app.route('/get_profesori', methods=['GET'])
    def get_profesori():
        # Parametri pentru paginare si cautare
        page = request.args.get('page', 1, type=int)
        termen_cautare = request.args.get('cautare', '')
        ignora_paginare = request.args.get('ignora_paginare', False, type=bool)
        per_page = 10
        cursor = mysql.connection.cursor()

        try:
            # Calcul offset pentru paginare
            offset = (page - 1) * per_page

            # Construire query cu join pentru date departament
            query_base = "SELECT p.*, d.nume_departament FROM profesori p LEFT JOIN departamente d ON p.departament = d.id_departament"
            if termen_cautare:
                query_base += " WHERE p.nume LIKE %s OR p.prenume LIKE %s"
                search_like = "%" + termen_cautare + "%"

            # Executare query cu sau fara paginare
            if ignora_paginare:
                query = query_base
                if termen_cautare:
                    cursor.execute(query, (search_like, search_like))
                else:
                    cursor.execute(query)
            else:
                if termen_cautare:
                    query = query_base + " LIMIT %s OFFSET %s"
                    cursor.execute(query, (search_like, search_like, per_page, offset))
                else:
                    query = query_base + " LIMIT %s OFFSET %s"
                    cursor.execute(query, (per_page, offset))

            profesori = cursor.fetchall()

            # Calculare numar total pentru paginare
            if not ignora_paginare:
                if termen_cautare:
                    cursor.execute("SELECT COUNT(*) as total FROM profesori WHERE nume LIKE %s OR prenume LIKE %s", (search_like, search_like))
                else:
                    cursor.execute("SELECT COUNT(*) as total FROM profesori")
                total_profesori = cursor.fetchone()['total']
            else:
                total_profesori = len(profesori)

            return jsonify({'profesori': profesori, 'total': total_profesori})
        except Exception as e:
            return jsonify({'error': str(e)}), 500
        finally:
            cursor.close()

    @app.route('/adauga_profesor', methods=['POST'])
    def adauga_profesor():
        data = request.get_json()
        cursor = mysql.connection.cursor()
        try:
            # Adaugare profesor in baza de date
            cursor.execute("INSERT INTO profesori (nume, prenume, departament, facultate, disponibilitate, email, telefon) VALUES (%s, %s, %s, %s, %s, %s, %s)",
                           (data['nume'], data['prenume'], data['departament'], data['facultate'], data['disponibilitate'], data['email'], data['telefon']))
            mysql.connection.commit()
            return jsonify({'message': 'Profesor adăugat cu succes'})
        except Exception as e:
            mysql.connection.rollback()
            return jsonify({'error': str(e)}), 500
        finally:
            cursor.close()

    @app.route('/update_profesor/<int:id>', methods=['POST'])
    def update_profesor(id):
        data = request.get_json()
        cursor = mysql.connection.cursor()
        try:
            # Actualizare profesor in baza de date
            cursor.execute("UPDATE profesori SET nume = %s, prenume = %s, departament = %s, facultate = %s, disponibilitate = %s, email = %s, telefon = %s WHERE id_profesor = %s",
                           (data['nume'], data['prenume'], data['departament'], data['facultate'], data['disponibilitate'], data['email'], data['telefon'], id))
            mysql.connection.commit()
            return jsonify({'message': 'Profesor actualizat cu succes'})
        except Exception as e:
            mysql.connection.rollback()
            return jsonify({'error': str(e)}), 500
        finally:
            cursor.close()

    @app.route('/sterge_profesor/<int:id>', methods=['DELETE'])
    def sterge_profesor(id):
        cursor = mysql.connection.cursor()
        try:
            # Stergere profesor din baza de date
            cursor.execute("DELETE FROM profesori WHERE id_profesor = %s", (id,))
            mysql.connection.commit()
            return jsonify({'message': 'Profesor șters cu succes'})
        except Exception as e:
            mysql.connection.rollback()
            return jsonify({'error': str(e)}), 500
        finally:
            cursor.close()

    @app.route('/get_profesor/<int:id>', methods=['GET'])
    def get_profesor(id):
        cursor = mysql.connection.cursor()
        try:
            # Obtinere profesor specificat
            cursor.execute("SELECT * FROM profesori WHERE id_profesor = %s", (id,))
            profesor = cursor.fetchone()
            if profesor:
                return jsonify(profesor)
            else:
                return jsonify({'message': 'Profesorul nu a fost găsit'}), 404
        except Exception as e:
            return jsonify({'error': str(e)}), 500
        finally:
            cursor.close()