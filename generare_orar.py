from flask import request, jsonify
import json
import requests
import os
from baza_de_date import mysql
from modele import Materie, Sala, Profesor, Grupa

# Dictionar pentru evidenta salilor ocupate
evidenta_salilor = {}

def init_orar_routes(app):
    @app.route('/regenereaza_orar/<semestru>', methods=['GET'])
    def regenereaza_orar(semestru):
        global evidenta_salilor
        evidenta_salilor = {}
        grupe = get_grupuri()
        orar_toate_grupele = {}
        for grupa in grupe:
            orar_toate_grupele[grupa.cod_grupa] = generare_orar(grupa.id_grupa, grupa.an_studiu, semestru)

        # Salvare orar in fisier JSON
        with open(f'static/orar_semestrul_{semestru}.json', 'w', encoding='utf-8') as fisier:
            json.dump(orar_toate_grupele, fisier, indent=4)

        return jsonify({'status': 'success', 'message': 'Orar regenerat cu succes'})
        
    @app.route('/genereaza_orar_toate_grupele/<semestru>', methods=['GET'])
    def genereaza_orar_toate_grupele(semestru):
        global evidenta_salilor
        evidenta_salilor = {}
        grupe = get_grupuri()
        orar_toate_grupele = {}
        # Generare orar pentru fiecare grupa
        for grupa in grupe:
            orar_toate_grupele[grupa.cod_grupa] = generare_orar(grupa.id_grupa, grupa.an_studiu, semestru)
        return jsonify(orar_toate_grupele)

def get_grupuri():
    # Extragere date grupuri din baza de date
    cursor = mysql.connection.cursor()
    cursor.execute("SELECT * FROM grupuri")
    grupuri_data = cursor.fetchall()
    cursor.close()
    return [Grupa(**grupa) for grupa in grupuri_data]

def get_profesori():
    # Extragere date profesori din baza de date
    cursor = mysql.connection.cursor()
    cursor.execute("SELECT * FROM profesori")
    profesori_data = cursor.fetchall()
    cursor.close()
    return [Profesor(**profesor) for profesor in profesori_data]

def get_materii_grupa(id_grupa, an, semestru):
    # Extragere materii pentru o grupa, an si semestru
    cursor = mysql.connection.cursor()
    query = "SELECT * FROM materii WHERE id_grupa = %s AND an = %s AND semestru = %s"
    cursor.execute(query, [id_grupa, an, semestru])
    materii = cursor.fetchall()
    cursor.close()
    return [Materie(**mat) for mat in materii]

def get_sali():
    # Extragere date sali din baza de date
    cursor = mysql.connection.cursor()
    cursor.execute("SELECT * FROM sali")
    sali = cursor.fetchall()
    cursor.close()
    return [Sala(**sala) for sala in sali]

def parse_disponibilitate(disponibilitate):
    # Parsare string disponibilitate profesor in format dictionary
    if not disponibilitate or disponibilitate.lower() == 'zilnic':
        return {zi: (9, 19) for zi in ['Luni', 'Marti', 'Miercuri', 'Joi', 'Vineri']}
    else:
        zile_disponibile = {}
        for segment in disponibilitate.split(','):
            try:
                zi, ore = segment.split('_')
                ore_inceput, ore_sfarsit = map(int, ore.split('-'))
                zile_disponibile[zi] = (ore_inceput, ore_sfarsit)
            except:
                # Utilizare valori implicite in caz de eroare
                return {zi: (9, 19) for zi in ['Luni', 'Marti', 'Miercuri', 'Joi', 'Vineri']}
        return zile_disponibile

def profesor_disponibil(profesor, zi, ora):
    # Verificare disponibilitate profesor pentru zi si ora
    if not profesor or not profesor.disponibilitate:
        return True  # Presupunem disponibilitate implicita
        
    zile_disponibile = parse_disponibilitate(profesor.disponibilitate)
    if zi in zile_disponibile:
        ore_inceput, ore_sfarsit = zile_disponibile[zi]
        return ore_inceput <= ora < ore_sfarsit
    return False

def generare_orar(id_grupa, an, semestru):
    # Obtinere date necesare pentru generarea orarului
    materii = get_materii_grupa(id_grupa, an, semestru)
    sali = get_sali()
    profesori = get_profesori()
    grupa = next((grupa for grupa in get_grupuri() if grupa.id_grupa == id_grupa), None)
    
    if not grupa:
        return {"saptamana_impara": {}, "saptamana_para": {}}
    
    # Initializare structura orare
    orar_impar = {zi: {ora: None for ora in range(9, 20)} for zi in ['Luni', 'Marti', 'Miercuri', 'Joi', 'Vineri']}
    orar_par = {zi: {ora: None for ora in range(9, 20)} for zi in ['Luni', 'Marti', 'Miercuri', 'Joi', 'Vineri']}
    
    # Procesare materii pentru alocare orare
    for materie in materii:
        if not materie.tip_ore:
            continue  # Ignorare materii fara ore definite
            
        # Procesare fiecare tip de activitate: curs, seminar, laborator, proiect
        for tip_ora, numar_ore_str in materie.tip_ore.items():
            # Validare numar ore
            if not isinstance(numar_ore_str, str) or not numar_ore_str.isdigit():
                continue
            numar_ore = int(numar_ore_str)
            # Obtinere profesor pentru activitate
            nume_profesor = getattr(materie, f'profesor_{tip_ora}', None)
            prof_materie = next((prof for prof in profesori if nume_profesor and f'{prof.nume} {prof.prenume}' == nume_profesor), None)
            # Alocare in functie de tipul activitatii
            if tip_ora.lower() in ['curs', 'seminar', 'proiect']:
                if numar_ore == 1:
                    alocare_ore(materie, tip_ora, 2, prof_materie, orar_par, sali, grupa)
                else:
                    alocare_ore(materie, tip_ora, numar_ore, prof_materie, orar_impar, sali, grupa)
                    alocare_ore(materie, tip_ora, numar_ore, prof_materie, orar_par, sali, grupa)
            elif tip_ora.lower() == 'laborator':
                # Alocare laboratoare pe semigrupe in saptamani diferite
                alocare_ore(materie, tip_ora, 2, prof_materie, orar_par, sali, grupa, semigrupa="A")
                alocare_ore(materie, tip_ora, 2, prof_materie, orar_impar, sali, grupa, semigrupa="B")

    return {"saptamana_impara": orar_impar, "saptamana_para": orar_par}

def alocare_ore(materie, tip_ora, numar_ore, prof_materie, orar, sali, grupa, semigrupa=None, este_grupa_completa=False):
    ore_alocate = 0  # Contor ore alocate
    sala_preferata = None

    # Cautare sala potrivita pentru activitate
    for zi in orar:
        for ora in range(9, 19):
            if ore_alocate == 0 and orar[zi][ora] is None:
                sala_preferata = alege_sala(sali, tip_ora, grupa, este_grupa_completa, orar, zi, ora)
                if sala_preferata:
                    break  # Sala gasita
        if sala_preferata:
            break
            
    # Alocare efectiva a orelor in orar
    for zi in orar:
        for ora in range(9, 19):
            if ore_alocate < numar_ore and orar[zi][ora] is None:
                # Verificare disponibilitate profesor
                if prof_materie and not profesor_disponibil(prof_materie, zi, ora):
                    continue  # Profesor indisponibil

                sala_aleasa = sala_preferata if sala_preferata else alege_sala(sali, tip_ora, grupa, este_grupa_completa, orar, zi, ora)

                if sala_aleasa and not este_sala_ocupata(sala_aleasa.id_sala, zi, ora):
                    # Marcare sala ca ocupata
                    marcheaza_sala_ca_ocupata(sala_aleasa.id_sala, zi, ora)
                    # Creare intrare orar
                    nume_materie = materie.nume_materie
                    if semigrupa:
                        nume_materie += f" (Semigrupa {semigrupa})"

                    orar_entry = {
                        "materie": nume_materie,
                        "tip_ora": tip_ora,
                        "sala": sala_aleasa.identificator_unic,
                        "profesor": f'{prof_materie.nume} {prof_materie.prenume}' if prof_materie else "Nedeterminat"
                    }
                    orar[zi][ora] = orar_entry
                    ore_alocate += 1

            if ore_alocate >= numar_ore:
                break
        if ore_alocate >= numar_ore:
            break

def alege_sala_pentru_proiect(sali, orar, zi, ora):
    # Alegere sala potrivita pentru activitati de proiect
    for sala in sali:
        if 'Proiect' in sala.tip_sala and not este_sala_ocupata(sala.id_sala, zi, ora):
            return sala
    return None

def este_profesor_ocupat(profesor, orar, zi, ora):
    # Verificare daca profesorul este ocupat la ora specificata
    ocupat = orar[zi].get(ora) is not None and orar[zi][ora].get("profesor") == f'{profesor.nume} {profesor.prenume}'
    return ocupat

def este_sala_ocupata(sala_id, zi, ora):
    # Verificare daca sala este ocupata
    return evidenta_salilor.get((sala_id, zi, ora), False)

def marcheaza_sala_ca_ocupata(sala_id, zi, ora):
    # Marcare sala ca fiind ocupata
    evidenta_salilor[(sala_id, zi, ora)] = True
    # Marcare in saptamana opusa pentru evitare coliziuni
    saptamana_opusa = 'par' if zi.endswith('impar') else 'impar'
    evidenta_salilor[(sala_id, f'{zi[:-5]}{saptamana_opusa}', ora)] = True

def alege_sala(sali, tip_ora, grupa, este_grupa_completa, orar, zi, ora):
    try:
        # Calcul capacitate necesara in functie de grupa
        capacitate_necesara = grupa.numar_studenti if este_grupa_completa else grupa.numar_studenti // 2
        if capacitate_necesara <= 0:
            capacitate_necesara = 30  # Valoare implicita
    except:
        capacitate_necesara = 30  # Valoare implicita
        
    sali_potrivite = []
    for sala in sali:
        try:
            # Verificare compatibilitate sala cu tipul activitatii
            tip_sala_lista = sala.tip_sala if isinstance(sala.tip_sala, list) else [sala.tip_sala]
            if (tip_ora.lower() in [t.lower() for t in tip_sala_lista] and 
                sala.capacitate >= capacitate_necesara and 
                not este_sala_ocupata(sala.id_sala, zi, ora)):
                sali_potrivite.append(sala)
        except:
            continue
            
    if sali_potrivite:
        return sali_potrivite[0]
    return None

def salveaza_orare_json():
    # Salvare orare pentru ambele semestre
    semestre = ['I', 'II']
    for semestru in semestre:
        try:
            # Creare director daca nu exista
            if not os.path.exists('static'):
                os.makedirs('static')
                
            # Generare orare pentru toate grupele
            grupe = get_grupuri()
            orar_toate_grupele = {}
            for grupa in grupe:
                try:
                    orar_toate_grupele[grupa.cod_grupa] = generare_orar(grupa.id_grupa, grupa.an_studiu, semestru)
                except Exception as e:
                    print(f"Eroare la generarea orarului pentru grupa {grupa.cod_grupa}: {str(e)}")
                    
            # Salvare in fisier JSON
            with open(f'static/orar_semestrul_{semestru}.json', 'w', encoding='utf-8') as fisier:
                json.dump(orar_toate_grupele, fisier, indent=4, ensure_ascii=False)
                
            print(f"Orarul pentru semestrul {semestru} a fost generat și salvat cu succes.")
        except Exception as e:
            print(f"Eroare la salvarea orarului pentru semestrul {semestru}: {str(e)}")