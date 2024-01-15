from flask import request, render_template, session, flash, redirect, url_for, jsonify
import hashlib
import smtplib
from email.mime.text import MIMEText
from baza_de_date import mysql

def init_auth_routes(app):
    @app.route('/login', methods=['GET', 'POST'])
    def login():
        # Redirectionare daca utilizatorul este deja logat
        if 'logged_in' in session:
            return redirect(url_for('formular_adauga_sala'))

        if request.method == 'POST':
            username = request.form['username']
            password_candidate = request.form['password']
            cur = mysql.connection.cursor()

            # Cautare utilizator in baza de date
            result = cur.execute("SELECT * FROM user_db WHERE username = %s", [username])

            if result > 0:
                data = cur.fetchone()
                password_stored = data['password']
                password_candidate_hashed = hashlib.sha256(password_candidate.encode()).hexdigest()

                # Verificare parola
                if password_candidate_hashed == password_stored:
                    session['logged_in'] = True
                    session['username'] = username
                    return redirect(url_for('formular_adauga_sala'))
                else:
                    flash('Parolă incorectă', 'danger')
            else:
                flash('Nume utilizator nu există', 'danger')

            cur.close()

        return render_template('login.html')

    @app.route('/logout')
    def logout():
        # Eliminare date sesiune la deconectare
        session.pop('logged_in', None)
        session.pop('username', None)
        flash('Ai fost deconectat', 'success')
        return redirect(url_for('login'))

    @app.route('/admin_register', methods=['GET', 'POST'])
    def admin_register():
        msg = ''
        cur = mysql.connection.cursor()
        cur.execute("SELECT id, username, email FROM user_db")
        users = cur.fetchall()
        
        if request.method == 'POST':
            userDetails = request.form
            username = userDetails['username']
            password_raw = userDetails['password']
            password_hash = hashlib.sha256(password_raw.encode()).hexdigest()  # Criptare parola
            email = userDetails['email']

            try:
                # Adaugare utilizator in baza de date
                cur.execute("INSERT INTO user_db(username, password, email) VALUES (%s, %s, %s)", 
                          (username, password_hash, email))
                mysql.connection.commit()

                # Trimitere email cu detalii de autentificare
                try:
                    send_email(email, username, password_raw)
                    msg = 'Utilizatorul a fost creat cu succes! Detaliile de autentificare au fost trimise prin email.'
                except Exception as e:
                    msg = f'Utilizatorul a fost creat, dar trimiterea emailului a eșuat: {str(e)}'
                
                cur.execute("SELECT id, username, email FROM user_db")
                users = cur.fetchall()
            except Exception as e:
                mysql.connection.rollback()
                msg = f'Eroare la crearea utilizatorului: {str(e)}'
                
        cur.close()
        return render_template('register.html', msg=msg, users=users)

    @app.route('/delete_user', methods=['POST'])
    def delete_user():
        user_id = request.form['id']
        cur = mysql.connection.cursor()
        try:
            # Stergere utilizator din baza de date
            cur.execute("DELETE FROM user_db WHERE id = %s", [user_id])
            mysql.connection.commit()
            return 'Utilizatorul a fost șters.'
        except Exception as e:
            mysql.connection.rollback()
            return f'Eroare la ștergerea utilizatorului: {str(e)}'
        finally:
            cur.close()

    @app.route('/edit_user', methods=['POST'])
    def edit_user():
        userDetails = request.form
        user_id = userDetails['id']
        username = userDetails['username']
        email = userDetails['email']
        password = userDetails['password']

        cur = mysql.connection.cursor()
        try:
            # Actualizare utilizator cu sau fara parola noua
            if password:
                password_hash = hashlib.sha256(password.encode()).hexdigest()
                cur.execute("UPDATE user_db SET username = %s, email = %s, password = %s WHERE id = %s", 
                            (username, email, password_hash, user_id))
                mysql.connection.commit()
                
                # Trimitere email cu noile detalii
                try:
                    send_email(email, username, password)
                    message = 'Utilizatorul a fost actualizat și emailul a fost trimis.'
                except Exception as e:
                    message = f'Utilizatorul a fost actualizat, dar trimiterea emailului a eșuat: {str(e)}'
                
                return message
            else:
                # Actualizare doar date de baza
                cur.execute("UPDATE user_db SET username = %s, email = %s WHERE id = %s", 
                            (username, email, user_id))
                mysql.connection.commit()
                return 'Utilizatorul a fost actualizat, dar parola nu a fost schimbată.'
        except Exception as e:
            mysql.connection.rollback()
            return f'Eroare la actualizarea utilizatorului: {str(e)}'
        finally:
            cur.close()

def send_email(recipient, username, password):
    # Trimitere email cu credentiale
    subject = "Detalii de autentificare"
    message = f"Username: {username}\nPassword: {password}"
    msg = MIMEText(message)
    msg['Subject'] = subject
    msg['From'] = 'orar_ro-soft@outlook.com'
    msg['To'] = recipient

    try:
        # Configurare si trimitere email prin SMTP
        server = smtplib.SMTP('smtp-mail.outlook.com', 587)
        server.starttls()
        server.login('orar_ro-soft@outlook.com', 'ro-soft.orar2')
        server.send_message(msg)
        server.quit()
    except Exception as e:
        print(f"Eroare la trimiterea emailului: {str(e)}")
        raise e