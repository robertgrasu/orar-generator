import json
import os
import threading
import requests

def creeaza_director_daca_nu_exista(cale_director):
    # Creare director nou daca nu exista
    if not os.path.exists(cale_director):
        os.makedirs(cale_director)

def salveaza_json(date, cale_fisier):
    # Salvare date in format JSON
    with open(cale_fisier, 'w', encoding='utf-8') as fisier:
        json.dump(date, fisier, indent=4, ensure_ascii=False)

def incarca_json(cale_fisier):
    # Incarcare date din fisier JSON
    if os.path.exists(cale_fisier):
        with open(cale_fisier, 'r', encoding='utf-8') as fisier:
            return json.load(fisier)
    return None

def ruleaza_in_background(functie, *args, **kwargs):
    # Executie functie in thread separat
    thread = threading.Thread(target=functie, args=args, kwargs=kwargs)
    thread.daemon = True
    thread.start()
    return thread

def trimite_cerere_api(url, metoda='GET', date=None, json_data=None, headers=None):
    # Trimitere cerere HTTP catre API
        metode = {
        'GET': requests.get,
        'POST': requests.post,
        'PUT': requests.put,
        'DELETE': requests.delete
    }
    
    if metoda not in metode:
        raise ValueError(f"Metoda {metoda} nu este suportată")
    
    try:
        raspuns = metode[metoda](url, data=date, json=json_data, headers=headers)
        raspuns.raise_for_status()
        return raspuns.json()
    except requests.exceptions.RequestException as e:
        print(f"Eroare la cererea API: {str(e)}")
        return None

def validare_email(email):
    # Validare format email corect
    import re
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}'
    return re.match(pattern, email) is not None