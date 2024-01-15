$(document).ready(function() {
    const numarPePagina = 10; // Numărul de materii pe pagină

    // Inițializare Selectize pentru Profesori
    function initializeProfesorSelectize() {
        $.ajax({
            url: '/get_profesori?ignora_paginare=true',
            type: 'GET',
            success: function(data) {

                ['profesorCursSelectize', 'profesorLaboratorSelectize', 'profesorSeminarSelectize', 'profesorProiectSelectize', 'edit_profesorCursSelectize', 'edit_profesorLaboratorSelectize', 'edit_profesorSeminarSelectize', 'edit_profesorProiectSelectize'].forEach(function(elementId) {
                    $('#' + elementId).selectize({
                        options: data.profesori.map(function(profesor) {
                            return { value: profesor.id_profesor, text: profesor.nume + ' ' + profesor.prenume };
                        }),
                        create: false,
                        sortField: 'text',
                        maxItems: 1
                    });
                });
            },
            error: function() {
                alert("Eroare la încărcarea listei de profesori.");
            }
        });
    }

    // Inițializare Selectize pentru Grupe
    function initializeGrupaSelectize() {
        $.ajax({
            url: '/get_grupuri',
            type: 'GET',
            success: function(data) {
                $('#grupaSelectize, #edit_grupaSelectize').selectize({
                    options: data.grupuri.map(function(grupa) {
                        return { value: grupa.id_grupa, text: grupa.cod_grupa };
                    }),
                    create: false,
                    sortField: 'text',
                    maxItems: 1
                });
            }
        });
    }
// Adăugarea unei noi materii
$('#formAdaugaMaterie').submit(function(e) {
    e.preventDefault();

    var tip_ore = {};
    if ($('#tipOreCurs').is(':checked')) {
        tip_ore.curs = $('#nrOreCurs').val();
    }
    if ($('#tipOreLaborator').is(':checked')) {
        tip_ore.laborator = $('#nrOreLaborator').val();
    }
    if ($('#tipOreSeminar').is(':checked')) {
        tip_ore.seminar = $('#nrOreSeminar').val();
    }
    if ($('#tipOreProiect').is(':checked')) {
        tip_ore.proiect = $('#nrOreProiect').val();
    }

    const materie = {
        nume_materie: $('#numeMaterie').val(),
        tip_ore: tip_ore, // Converteste obiectul tip_ore într-un șir JSON
        profesor_curs: $('#profesorCursSelectize').val(),
        profesor_laborator: $('#profesorLaboratorSelectize').val(),
        profesor_seminar: $('#profesorSeminarSelectize').val(),
        profesor_proiect: $('#profesorProiectSelectize').val(),
        id_grupa: $('#grupaSelectize').val(),
        an: $('#anSelect').val(),
        semestru: $('#semestruSelect').val(),
        cod: $('#codMaterie').val()
    };

    $.ajax({
        url: '/adauga_materie',
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(materie),
        success: function(response) {
            alert('Materie adăugată cu succes.');
            $('#formAdaugaMaterie').trigger('reset');
                        resetFormCheckboxState();

            incarcaMaterii();
        },
        error: function(error) {
            alert('Eroare la adăugarea materiei: ' + error.responseText);
        }
    });
});
$('#formAdaugaMaterie').on('reset', function() {
    resetFormCheckboxState();
});
    // Funcția pentru încărcarea și afișarea materiilor
function incarcaMaterii(paginaCurenta = 1) {
    $.ajax({
        url: '/get_materii',
        type: 'GET',
        data: { page: paginaCurenta, per_page: numarPePagina },
        success: function(response) {
            const listaMaterii = $('#listaMaterii');
            listaMaterii.empty();
            const tabel = $('<table>').addClass('table table-striped table-hover');
            const thead = $('<thead>').html('<tr><th>ID</th><th>Nume Materie</th><th>Profesor Curs</th><th>Profesor Laborator</th><th>Profesor Seminar</th><th>Profesor Proiect</th><th>Grupa</th><th>An</th><th>Sem</th><th>Cod</th><th class="spacing">C</th><th class="spacing">L</th><th class="spacing">S</th><th class="spacing">P</th><th>Acțiuni</th></tr>');
            const tbody = $('<tbody>');

            response.materii.forEach(function(materie) {
                let ore = JSON.parse(materie.tip_ore || '{}'); // Parsează șirul JSON
                const tr = $('<tr>').append(
                    $('<td>').text(materie.id_materie),
                    $('<td>').text(materie.nume_materie),
                    $('<td>').text(materie.profesor_curs || '-'),
                    $('<td>').text(materie.profesor_laborator || '-'),
                    $('<td>').text(materie.profesor_seminar || '-'),
                    $('<td>').text(materie.profesor_proiect || '-'),
                    $('<td>').text(materie.cod_grupa),
                    $('<td>').text(materie.an),
                    $('<td>').text(materie.semestru),
                    $('<td>').text(materie.cod),
                    $('<td>').text(ore.curs || '-'),
                    $('<td>').text(ore.laborator || '-'),
                    $('<td>').text(ore.seminar || '-'),
                    $('<td>').text(ore.proiect || '-'),
                    $('<td>').append(
                        $('<div>').addClass('action-btn-container').append(
                            $('<button>').addClass('btn btn-secondary btn-sm edit-btn action-btn').attr('data-id', materie.id_materie).html('<i class="bi bi-pencil-square"></i>'),
                            $('<button>').addClass('btn btn-danger btn-sm delete-btn action-btn').attr('data-id', materie.id_materie).html('<i class="bi bi-trash-fill"></i>')
                        )
                    )
                );
                tbody.append(tr);
            });

            tabel.append(thead).append(tbody);
            listaMaterii.append(tabel);
            creeazaButoanePaginare(response.total_pages, paginaCurenta);
        },
        error: function(error) {
            alert('Eroare la încărcarea materiilor: ' + error.responseText);
        }
    });
}

    // Funcția pentru crearea butoanelor de paginare
    function creeazaButoanePaginare(totalPagini, paginaCurenta) {
        const paginatie = $('.pagination');
        paginatie.empty();

        for (let i = 1; i <= totalPagini; i++) {
            const li = $('<li>').addClass(`page-item ${i === paginaCurenta ? 'active' : ''}`);
            const a = $('<a>').addClass('page-link').attr('href', '#').text(i);
            a.on('click', function (e) {
                e.preventDefault();
                incarcaMaterii(i);
            });
            li.append(a);
            paginatie.append(li);
        }
    }

    // Toggle pentru afișarea inputurilor de ore și selectizelor
function toggleVisibility(checkbox) {
    var checkboxId = '#' + checkbox.id;
    var inputId = checkboxId.replace('tipOre', 'nrOre');

    // Determină dacă elementul se află în modal
    var isModal = $(checkbox).closest('#modalEditareMaterie').length > 0;

    // Construiește ID-ul containerului Selectize pe baza contextului
    var containerId;
    if (isModal) {
        containerId = '#containerEditProfesor' + checkboxId.replace('#edit_tipOre', '') + 'Selectize';
    } else {
        containerId = '#containerProfesor' + checkboxId.replace('#tipOre', '') + 'Selectize';
    }

    // Arată sau ascunde inputurile și Selectize
    if ($(checkboxId).is(':checked')) {
        $(inputId).show();
        $(containerId).show();
    } else {
        $(inputId).hide();
        $(containerId).hide();
    }
}

// Atașează listenerii pentru checkbox-uri
$('.form-check-input').change(function() {
    toggleVisibility(this);
});

// Atașează listenerii pentru checkbox-uri în modal
$('#modalEditareMaterie .form-check-input').change(function() {
    toggleVisibility(this);
});
$('#tipOreCurs').change(function() {
    toggleVisibility('#' + this.id, '#' + this.id.replace('tipOre', 'nrOre'), '#containerProfesorCursSelectize');
});
$('#tipOreLaborator').change(function() {
    toggleVisibility('#' + this.id, '#' + this.id.replace('tipOre', 'nrOre'), '#containerProfesorLaboratorSelectize');
});

$('#tipOreSeminar').change(function() {
    toggleVisibility('#' + this.id, '#' + this.id.replace('tipOre', 'nrOre'), '#containerProfesorSeminarSelectize');
});

$('#tipOreProiect').change(function() {
    toggleVisibility('#' + this.id, '#' + this.id.replace('tipOre', 'nrOre'), '#containerProfesorProiectSelectize');
});
    // $('#tipOreLaborator, #edit_tipOreLaborator').change(function() {
    //     toggleNrOreInput('#' + this.id, '#' + this.id.replace('tipOre', 'nrOre'), '#' + this.id.replace('tipOre', 'profesor') + 'Selectize');
    // });
    // $('#tipOreSeminar, #edit_tipOreSeminar').change(function() {
    //     toggleNrOreInput('#' + this.id, '#' + this.id.replace('tipOre', 'nrOre'), '#' + this.id.replace('tipOre', 'profesor') + 'Selectize');
    // });
    // $('#tipOreProiect, #edit_tipOreProiect').change(function() {
    //     toggleNrOreInput('#' + this.id, '#' + this.id.replace('tipOre', 'nrOre'), '#' + this.id.replace('tipOre', 'profesor') + 'Selectize');
    // });

    // Event listener pentru deschiderea modalului de editare
$(document).on('click', '.edit-btn', function() {
    const id_materie = $(this).data('id');
    $.ajax({
        url: '/get_materie/' + id_materie,
        type: 'GET',
        success: function(materie) {
            // Setăm valorile de bază ale materiei
            $('#edit_id_materie').val(materie.id_materie);
            $('#edit_numeMaterie').val(materie.nume_materie);
            $('#edit_grupaSelectize')[0].selectize.setValue(materie.id_grupa);
            $('#edit_anSelect').val(materie.an);
            $('#edit_semestruSelect').val(materie.semestru);
            $('#edit_codMaterie').val(materie.cod);
            setareTipuriOreSiProfesori(materie);
            // Parcurgem și populăm informațiile despre tipurile de ore
            let tipuriOre = typeof materie.tip_ore === 'string' ? JSON.parse(materie.tip_ore) : materie.tip_ore;

            ['Curs', 'Laborator', 'Seminar', 'Proiect'].forEach(function(tipOra) {
                var checkboxId = '#edit_tipOre' + tipOra;
                var nrOreId = '#edit_nrOre' + tipOra;
                var selectizeId = '#edit_profesor' + tipOra + 'Selectize';
                var numeProfesor = materie['profesor_' + tipOra.toLowerCase()];

                if (tipuriOre[tipOra.toLowerCase()]) {
                    $(checkboxId).prop('checked', true);
                    $(nrOreId).val(tipuriOre[tipOra.toLowerCase()]).show();
                    selectizeSetProfesor(selectizeId, numeProfesor);
                    $(selectizeId).show();
                } else {
                    $(checkboxId).prop('checked', false);
                    $(nrOreId).hide();
                    $(selectizeId).hide();
                }
            });

            $('#modalEditareMaterie').modal('show');
        },
        error: function(error) {
            alert('Eroare la obținerea datelor materiei: ' + error.responseText);
        }
    });
});

$('#modalEditareMaterie').on('hidden.bs.modal', function () {
    $('#formEditareMaterie')[0].reset();
    // Resetează toate selectize-urile la starea lor inițială
    resetSelectize();
});
function resetFormCheckboxState() {
    $('#formAdaugaMaterie .form-check-input').each(function() {
        $(this).prop('checked', false);
        toggleVisibility(this); // Ascunde inputurile și selectize-urile asociate
    });
}

function resetSelectize() {
    // pentru fiecare selectize
    ['Curs', 'Laborator', 'Seminar', 'Proiect'].forEach(function(tipOra) {
        var selectizeId = '#edit_profesor' + tipOra + 'Selectize';
        var selectize = $(selectizeId)[0].selectize;
        selectize.clear();
        $(selectizeId).hide();
    });


}

function setareTipuriOreSiProfesori(materie) {
    // presupunând că materie.tip_ore este un obiect sau un string JSON cu structura { curs: '3', laborator: '2', ... }
    let tipuriOre = typeof materie.tip_ore === 'string' ? JSON.parse(materie.tip_ore) : materie.tip_ore;

    // pentru fiecare tip de ore
    ['Curs', 'Laborator', 'Seminar', 'Proiect'].forEach(function(tipOra) {
        var checkboxId = '#edit_tipOre' + tipOra;
        var nrOreId = '#edit_nrOre' + tipOra;
        var selectizeId = '#edit_profesor' + tipOra + 'Selectize';

        // Setează starea checkboxului și a inputului de număr de ore
        if (tipuriOre[tipOra.toLowerCase()]) {
            $(checkboxId).prop('checked', true);
            $(nrOreId).val(tipuriOre[tipOra.toLowerCase()]).show();
        } else {
            $(checkboxId).prop('checked', false);
            $(nrOreId).hide();
        }

        // Setează profesorul selectat pentru fiecare tip de ore, dacă există
        var numeProfesor = materie['profesor_' + tipOra.toLowerCase()];
        selectizeSetProfesor(selectizeId, numeProfesor);

        // Actualizează vizibilitatea selectize-ului
        toggleVisibility(document.getElementById(checkboxId.substring(1))); // trimite elementul checkbox, nu ID-ul
    });
}

function selectizeSetProfesor(selectizeId, numeProfesor) {
    var selectize = $(selectizeId)[0].selectize;
    var idProfesor = findProfesorIdByName(selectize, numeProfesor);

    if (idProfesor) {
        selectize.setValue(idProfesor);
    }
}

function findProfesorIdByName(selectize, numeProfesor) {
    var foundId = null;
    $.each(selectize.options, function(id, option) {
        if (option.text === numeProfesor) {
            foundId = id;
            return false; // Oprește bucla
        }
    });
    return foundId;
}
function updateSelectize(selectizeId, numeProfesor) {
    var selectize = $(selectizeId)[0].selectize;

    // Verificăm dacă profesorul există deja în opțiunile selectize
    var existaDeja = Object.values(selectize.options).some(option => option.text === numeProfesor);

    // Dacă profesorul nu există, îl adăugăm
    if (!existaDeja) {
        selectize.addOption({ value: numeProfesor, text: numeProfesor });
    }

    selectize.setValue(numeProfesor, true);
}


$('#updateMaterieBtn').click(function() {
    const id_materie = $('#edit_id_materie').val();
    var tip_ore = {};

    ['Curs', 'Laborator', 'Seminar', 'Proiect'].forEach(function(tipOra) {
        var checkboxId = '#edit_tipOre' + tipOra;
        var nrOreId = '#edit_nrOre' + tipOra;
        var selectizeId = '#edit_profesor' + tipOra + 'Selectize';

        if ($(checkboxId).is(':checked')) {
            tip_ore[tipOra.toLowerCase()] = $(nrOreId).val();
        }
    });

    // Funcție pentru a obține numele profesorului din Selectize
    function getProfesorNume(selectizeId) {
        var selectize = $(selectizeId)[0].selectize;
        var valoareSelectata = selectize.getValue();
        var numeProfesor = (selectize.options[valoareSelectata]) ? selectize.options[valoareSelectata].text : '';
        return numeProfesor;
    }

    const updatedData = {
        nume_materie: $('#edit_numeMaterie').val(),
        tip_ore: tip_ore,
        id_grupa: $('#edit_grupaSelectize').val(),
        an: $('#edit_anSelect').val(),
        semestru: $('#edit_semestruSelect').val(),
        cod: $('#edit_codMaterie').val(),
        profesor_curs: getProfesorNume('#edit_profesorCursSelectize'),
        profesor_laborator: getProfesorNume('#edit_profesorLaboratorSelectize'),
        profesor_seminar: getProfesorNume('#edit_profesorSeminarSelectize'),
        profesor_proiect: getProfesorNume('#edit_profesorProiectSelectize')
    };

    $.ajax({
        url: '/update_materie/' + id_materie,
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(updatedData),
        success: function(response) {
            alert('Materie actualizată cu succes.');
            $('#modalEditareMaterie').modal('hide');
            incarcaMaterii();
        },
        error: function(error) {
            alert('Eroare la actualizarea materiei: ' + error.responseText);
        }
    });
});





    // Event listener pentru ștergerea unei materii
    $(document).on('click', '.delete-btn', function() {
        const id_materie = $(this).data('id');
        if (confirm('Ești sigur că vrei să ștergi această materie?')) {
            $.ajax({
                url: '/sterge_materie/' + id_materie,
                type: 'DELETE',
                success: function(response) {
                    alert('Materie ștearsă cu succes.');
                    incarcaMaterii();
                },
                error: function(error) {
                    alert('Eroare la ștergerea materiei: ' + error.responseText);
                }
            });
        }
    });

    incarcaMaterii();
    initializeProfesorSelectize();
    initializeGrupaSelectize();
});