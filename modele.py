import json

class Materie:
    def __init__(self, id_materie, nume_materie, tip_ore=None, id_grupa=None, id_profesor=None, an=None, semestru=None, cod=None, 
                 profesor_curs=None, profesor_laborator=None, profesor_seminar=None, profesor_proiect=None, **kwargs):
        # Initializare atribute materie
        self.id_materie = id_materie
        self.nume_materie = nume_materie
        
        # Procesare camp tip_ore
        if isinstance(tip_ore, str):
            try:
                self.tip_ore = json.loads(tip_ore)
            except:
                self.tip_ore = {}
        elif isinstance(tip_ore, dict):
            self.tip_ore = tip_ore
        else:
            self.tip_ore = {}
            
        # Atribute suplimentare materie
        self.id_grupa = id_grupa
        self.an = an
        self.semestru = semestru
        self.cod = cod
        self.profesor_curs = profesor_curs
        self.profesor_laborator = profesor_laborator
        self.profesor_seminar = profesor_seminar
        self.profesor_proiect = profesor_proiect
        self.id_profesor = id_profesor

class Sala:
    def __init__(self, id_sala, corp, etaj, numar_sala, capacitate, identificator_unic, tip_sala, **kwargs):
        # Initializare atribute sala
        self.id_sala = id_sala
        self.corp = corp
        self.etaj = etaj
        self.numar_sala = numar_sala
        self.capacitate = capacitate
        self.identificator_unic = identificator_unic
        
        # Procesare camp tip_sala
        if isinstance(tip_sala, str):
            self.tip_sala = tip_sala.split(", ")
        elif isinstance(tip_sala, list):
            self.tip_sala = tip_sala
        else:
            self.tip_sala = []

class Profesor:
    def __init__(self, id_profesor, nume, prenume, departament=None, facultate=None, disponibilitate=None, email=None, telefon=None, **kwargs):
        # Initializare atribute profesor
        self.id_profesor = id_profesor
        self.nume = nume
        self.prenume = prenume
        self.departament = departament
        self.facultate = facultate
        self.disponibilitate = disponibilitate
        self.email = email
        self.telefon = telefon

class Grupa:
    def __init__(self, id_grupa, cod_grupa, id_departament=None, facultate=None, specializare=None, an_studiu=None, 
                 numar_studenti=None, studenti_buget=None, studenti_taxa=None, nume_departament=None, **kwargs):
        # Initializare atribute grupa
        self.id_grupa = id_grupa
        self.cod_grupa = cod_grupa
        self.id_departament = id_departament
        self.facultate = facultate
        self.specializare = specializare
        self.an_studiu = an_studiu
        
        # Procesare numar studenti
        try:
            self.numar_studenti = int(numar_studenti) if numar_studenti is not None else 0
        except:
            self.numar_studenti = 0
            
        # Atribute suplimentare grupa
        self.studenti_buget = studenti_buget
        self.studenti_taxa = studenti_taxa
        self.nume_departament = nume_departament