from flask import Flask, render_template, flash, redirect, url_for, session
import threading
import json
import os

# Initializare aplicatie Flask
app = Flask(__name__)
app.secret_key = 'SECRET_KEY_PLACEHOLDER'

# Configurare conexiune MySQL
app.config['MYSQL_HOST'] = 'DATABASE_HOST'
app.config['MYSQL_USER'] = 'DB_CREDENTIAL'
app.config['MYSQL_PASSWORD'] = 'DB_CREDENTIAL'
app.config['MYSQL_DB'] = 'DB_CREDENTIAL'
app.config['MYSQL_CURSORCLASS'] = 'DictCursor'

# Import module dupa initializare aplicatie
from baza_de_date import mysql, init_db
from autentificare import init_auth_routes
from rute_sali import init_sali_routes
from rute_profesori import init_profesori_routes
from rute_grupe import init_grupe_routes
from rute_departamente import init_departamente_routes
from rute_materii import init_materii_routes
from generare_orar import init_orar_routes, salveaza_orare_json

# Initializare baza de date
init_db(app)

# Initializare rute pentru modulele aplicatiei
init_auth_routes(app)
init_sali_routes(app)
init_profesori_routes(app)
init_grupe_routes(app)
init_departamente_routes(app)
init_materii_routes(app)
init_orar_routes(app)

# Rute principale pentru paginile aplicatiei
@app.route('/')
def index():
    return render_template('index.html')

@app.route('/despre')
def despre():
    return render_template('despre.html')

@app.route('/contact')
def contact():
    return render_template('contact.html')

@app.route('/orar_grupe')
def orar_grupe():
    return render_template('orar_grupe.html')

@app.route('/orar_profesori')
def orar_prof():
    return render_template('orar_profesori.html')

@app.route('/orar_sali')
def orar_sali():
    return render_template('orar_sali.html')

@app.route('/dashboard')
def dashboard():
    # Verificare autentificare pentru acces dashboard
    if 'logged_in' not in session:
        flash('Vă rugăm să vă logați pentru a accesa această pagină.', 'danger')
        return redirect(url_for('login'))
    return render_template('dashboard.html')

@app.route('/orar_admin')
def orar_admin():
    # Verificare autentificare pentru acces admin
    if 'logged_in' not in session:
        flash('Vă rugăm să vă logați pentru a accesa această pagină.', 'danger')
        return redirect(url_for('login'))
    return render_template('orar_grupe_admin.html')

@app.route('/orar_grupe_admin')
def orar_grupe_admin():
    # Verificare autentificare pentru acces admin
    if 'logged_in' not in session:
        flash('Vă rugăm să vă logați pentru a accesa această pagină.', 'danger')
        return redirect(url_for('login'))
    return render_template('orar_grupe_admin.html')

@app.route('/orar_profesori_admin')
def orar_profesori_admin():
    # Verificare autentificare pentru acces admin
    if 'logged_in' not in session:
        flash('Vă rugăm să vă logați pentru a accesa această pagină.', 'danger')
        return redirect(url_for('login'))
    return render_template('orar_profesori_admin.html')

@app.route('/orar_sali_admin')
def orar_sali_admin():
    # Verificare autentificare pentru acces admin
    if 'logged_in' not in session:
        flash('Vă rugăm să vă logați pentru a accesa această pagină.', 'danger')
        return redirect(url_for('login'))
    return render_template('orar_sali_admin.html')

def ruleaza_in_background():
    # Pornire proces de generare orare in thread separat
    thread = threading.Thread(target=salveaza_orare_json)
    thread.daemon = True
    thread.start()

if __name__ == '__main__':
    if not os.path.exists('static'):
        os.makedirs('static')
    
    ruleaza_in_background()
    app.run(debug=True)