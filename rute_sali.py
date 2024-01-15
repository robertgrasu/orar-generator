from flask import request, render_template, session, flash, redirect, url_for, jsonify
from baza_de_date import mysql

def init_sali_routes(app):
    @app.route('/formular_adauga_sala', methods=['GET'])
    def formular_adauga_sala():
        # Verificare autentificare pentru acces pagina
        if 'logged_in' not in session:
            flash('Vă rugăm să vă logați pentru a accesa această pagină.', 'danger')
            return redirect(url_for('login'))
        return render_template('adauga_sala.html')

    @app.route('/adauga_sala', methods=['POST'])
    def adauga_sala():
        data = request.get_json()
        corp = data['corp']
        etaj = data['etaj']
        numar_sala = data['numar_sala']
        capacitate = data['capacitate']
        tip_sala = data['tip_sala']
        # Generare identificator unic pentru sala
        identificator_unic = f"{corp}{etaj}{numar_sala}"

        cur = mysql.connection.cursor()
        try:
            # Adaugare sala in baza de date
            cur.execute("INSERT INTO sali (corp, etaj, numar_sala, capacitate, tip_sala, identificator_unic) VALUES (%s, %s, %s, %s, %s, %s)",
                        (corp, etaj, numar_sala, capacitate, tip_sala, identificator_unic))
            mysql.connection.commit()
            response = {"success": True, "message": "Sala adăugată cu succes!"}
        except Exception as e:
            mysql.connection.rollback()
            response = {"success": False, "message": str(e)}
        finally:
            cur.close()
        return jsonify(response)

    @app.route('/get_sali', methods=['GET'])
    def get_sali():
        # Parametri pentru filtrare si paginare
        corp = request.args.get('corp', '')
        limit = request.args.get('limit', 10, type=int)
        offset = request.args.get('offset', 0, type=int)

        cur = mysql.connection.cursor()
        try:
            # Obtinere sali filtrate si paginate
            query = "SELECT * FROM sali WHERE corp LIKE %s LIMIT %s OFFSET %s"
            cur.execute(query, ('%' + corp + '%', limit, offset))
            sali = cur.fetchall()

            # Obtinere numar total sali pentru paginare
            cur.execute("SELECT COUNT(*) as count FROM sali WHERE corp LIKE %s", ('%' + corp + '%',))
            total_sali = cur.fetchone()['count']
            
            return jsonify({'sali': sali, 'total': total_sali})
        except Exception as e:
            return jsonify({'error': str(e)}), 500
        finally:
            cur.close()

    @app.route('/get_sala/<int:id_sala>', methods=['GET'])
    def get_sala(id_sala):
        cur = mysql.connection.cursor()
        try:
            # Obtinere sala specificata
            result = cur.execute("SELECT * FROM sali WHERE id_sala = %s", (id_sala,))
            if result > 0:
                sala = cur.fetchone()
                return jsonify(sala)
            else:
                return jsonify({"error": "Sala nu a fost găsită"}), 404
        except Exception as e:
            return jsonify({"error": str(e)}), 500
        finally:
            cur.close()

    @app.route('/update_sala/<int:id_sala>', methods=['POST'])
    def update_sala(id_sala):
        data = request.get_json()
        corp = data['corp']
        etaj = data['etaj']
        numar_sala = data['numar_sala']
        capacitate = data['capacitate']
        tip_sala = data['tip_sala']
        # Regenerare identificator unic pentru sala
        identificator_unic = f"{corp}{etaj}{numar_sala}"

        cur = mysql.connection.cursor()
        try:
            # Actualizare sala in baza de date
            cur.execute("UPDATE sali SET corp=%s, etaj=%s, numar_sala=%s, capacitate=%s, tip_sala=%s, identificator_unic=%s WHERE id_sala=%s",
                        (corp, etaj, numar_sala, capacitate, tip_sala, identificator_unic, id_sala))
            mysql.connection.commit()
            response = {"success": True, "message": "Sala actualizată cu succes!"}
        except Exception as e:
            mysql.connection.rollback()
            response = {"success": False, "message": str(e)}
        finally:
            cur.close()
        return jsonify(response)

    @app.route('/delete_sala/<int:id_sala>', methods=['POST'])
    def delete_sala(id_sala):
        try:
            cur = mysql.connection.cursor()
            # Stergere sala din baza de date
            cur.execute("DELETE FROM sali WHERE id_sala=%s", (id_sala,))
            mysql.connection.commit()
            response = {"success": True, "message": "Sala a fost ștearsă cu succes."}
        except Exception as e:
            mysql.connection.rollback()
            response = {"success": False, "message": str(e)}
        finally:
            cur.close()
        return jsonify(response)