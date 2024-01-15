from flask_mysqldb import MySQL

# init MySQL pentru conectare la baza de date
mysql = MySQL()

def init_db(app):

    # Configurare si initializare conexiune MySQL pentru aplicatia Flask
    mysql.init_app(app)
    print("Conexiunea la baza de date a fost inițializată cu succes.")