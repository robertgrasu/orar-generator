$(document).ready(function () {
    let departamenteExistente = [];
    let departamentePePagina = 10;
    let paginaCurenta = 1;

    function incarcaProfesori() {
        $.ajax({
            url: '/get_profesori?ignora_paginare=true',
            type: 'GET',
            success: function (data) {

                $('#sef_departament').selectize({
                    options: data.profesori.map(profesor => ({
                        value: profesor.id_profesor,
                        text: profesor.nume + ' ' + profesor.prenume
                    })),
                    create: false,
                    maxItems: 1,
                    sortField: 'text'
                });
            },
            error: function () {
                alert('Eroare la incarcarea profesorilor.');
            }
        });
    }


    function incarcaDepartamente() {
        var facultateSelectata = $('#filtrareFacultate').val();
        $.ajax({
            url: '/get_departamente',
            type: 'GET',
            data: {
                page: paginaCurenta,
                per_page: departamentePePagina,
                facultate: facultateSelectata
            },
            success: function (data) {
                departamenteExistente = data.departamente;
                numarTotalDepartamente = data.total;
                afiseazaDepartamente();
                afiseazaPaginare();
            },
            error: function () {
                alert('Eroare la preluarea departamentelor.');
            }
        });
    }

    // Event listener pentru selectarea unei facultati
    $('#filtrareFacultate').change(function () {
        incarcaDepartamente(); // reincarca departamentele cu filtrul aplicat
    });



    $('#modalEditareDepartament').on('shown.bs.modal', function (e) {
        var id_departament = $(e.relatedTarget).data('id');

        // Solicita informatii despre departamentul selectat
        $.ajax({
            url: '/get_departament/' + id_departament,
            type: 'GET',
            success: function (departament) {
                // Seteaza valorile existente in campurile de editare
                $('#edit_id_departament').val(departament.id_departament);
                $('#edit_facultate').val(departament.facultate);
                $('#edit_nume_departament').val(departament.nume_departament);
                $('#edit_cod_unic').val(departament.cod_unic);

                var $selectizeDiv = $('#edit_sef_departament_selectize');
                if ($selectizeDiv[0].selectize) {
                    $selectizeDiv[0].selectize.destroy();
                }
                $selectizeDiv.empty();

                var $input = $('<input>', { type: 'text', style: 'display: none;' }).appendTo($selectizeDiv);

                // Solicita lista profesorilor pentru a popula Selectize
                $.ajax({
                    url: '/get_profesori',
                    type: 'GET',
                    success: function (data) {
                        $input.selectize({
                            options: data.profesori.map(function (profesor) {
                                return { value: profesor.id_profesor, text: profesor.nume + ' ' + profesor.prenume };
                            }),
                            create: false,
                            sortField: 'text',
                            maxItems: 1
                        });

                        var selectize = $input[0].selectize;
                        selectize.addOption({ value: departament.id_sef, text: departament.nume_sef });
                        selectize.setValue(departament.id_sef);
                    }
                });
            },
            error: function () {
                alert('Eroare la preluarea datelor departamentului.');
            }
        });
    });


    // Functie pentru afișarea departamentelor in tabel
    function afiseazaDepartamente() {
        var tbody = $('#listaDepartamente table tbody');
        tbody.empty();
        departamenteExistente.forEach(function (departament) {

            var row = `
                <tr>
                    <td>${departament.id_departament}</td>
                    <td>${departament.facultate}</td>
                    <td>${departament.nume_departament}</td>
                    <td>${departament.sef_departament || ''}</td>
                    <td>${departament.cod_unic}</td>
                    <td>${departament.specializari}</td>

                    <td class="text-center">
                      <div class="action-btns">
                                            <button class="btn btn-secondary btn-sm edit-btn" data-id="${departament.id_departament}" data-bs-toggle="modal" data-bs-target="#modalEditareDepartament">
                          <i class="bi bi-pencil-square"></i>
                        </button>
                                            <button class="btn btn-danger btn-sm delete-btn" data-id="${departament.id_departament}">
                          <i class="bi bi-trash-fill"></i>
                        </button>
                      </div>
                    </td>
                </tr>
            `;
            tbody.append(row);
        });
    }

    // Functie pentru afișarea paginarii
    function afiseazaPaginare() {
        let totalPagini = Math.ceil(numarTotalDepartamente / departamentePePagina);
        let paginareHTML = '';
        for (let i = 1; i <= totalPagini; i++) {
            paginareHTML += `<li class="page-item ${i === paginaCurenta ? 'active' : ''}">` +
                `<button class="page-link" data-page="${i}">${i}</button></li>`;
        }
        $('.pagination').html(paginareHTML);
        $('.pagination').parent().addClass('text-center');
    }

    // Event listener pentru paginare
    $(document).on('click', '.page-link', function (e) {
        e.preventDefault();
        paginaCurenta = parseInt($(this).data('page'));
        incarcaDepartamente();
    });

    // Event listener pentru adaugarea unui nou departament
    $('#formAdaugaDepartament').submit(function (e) {
        e.preventDefault();
        let specializariArray = [];
        $('#specializari').each(function () {
            specializariArray.push($(this).val());
        });
        $('.specializari-extra').each(function () {
            if ($(this).val().trim() !== "") {
                specializariArray.push($(this).val());
            }
        });


        let departamentNou = {
            facultate: $('#facultate').val(),
            nume_departament: $('#nume_departament').val(),
            sef_departament: $('#sef_departament').val(),
            cod_unic: $('#cod_unic').val(),
            specializari: specializariArray.join(', ')
        };

        $.ajax({
            url: '/adauga_departament',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(departamentNou),
            success: function (response) {
                alert(response.message);
                $('#formAdaugaDepartament').trigger("reset");
                incarcaDepartamente();
            },
            error: function (error) {
                alert('Eroare la adaugarea departamentului: ' + error.responseText);
            }
        });
    });


    // Resetare formular la apasarea butonului de reset
    $('#mai_multe_specializari').click(function () {
        let checkbox = $(this);
        setTimeout(function () {
            checkbox.prop('checked', false);
        }, 300); // Delay de 500 ms
    });
    $('#edit_mai_multe_specializari').click(function () {
        let checkbox = $(this);
        setTimeout(function () {
            checkbox.prop('checked', false);
        }, 300); // Delay de 500 ms
    });
    $('#mai_multe_specializari').change(function () {
        if ($(this).is(':checked')) {
            // Adaugam un nou camp de intrare pentru specializari
            var newInputGroup = $('<div/>', {
                'class': 'input-group mt-2 specializari-extra-group'
            }).append($('<input/>', {
                'type': 'text',
                'class': 'form-control specializari-extra',
                'name': 'specializari[]'
            })).append($('<button/>', {
                'type': 'button',
                'class': 'btn btn-danger btn-sm remove-specializare',
                'html': '<i class="bi bi-x-lg"></i>'
            }));

            $('#specializari').after(newInputGroup);
        }

    });
    $('#adauga_specializari').click(function () {
        var newInputGroup = $('<div/>', {
            'class': 'input-group mt-2 specializari-extra-group'
        }).append($('<input/>', {
            'type': 'text',
            'class': 'form-control specializari-extra',
            'name': 'specializari[]'
        })).append($('<button/>', {
            'type': 'button',
            'class': 'btn btn-danger btn-sm remove-specializare',
            'html': '<i class="bi bi-x-lg"></i>'
        }));

        $('#specializari').after(newInputGroup);
    });
    $('#edit_mai_multe_specializari').change(function () {
        if ($(this).is(':checked')) {
            var newInputGroup = $('<div/>', {
                'class': 'input-group mt-2 edit-specializari-extra-group'
            }).append($('<input/>', {
                'type': 'text',
                'class': 'form-control edit-specializari-extra',
                'name': 'edit_specializari[]'
            })).append($('<button/>', {
                'type': 'button',
                'class': 'btn btn-danger btn-sm remove-edit-specializare',
                'html': '<i class="bi bi-x-lg"></i>'
            }));

            $('#edit_specializari').after(newInputGroup);
        }
    });

    $(document).on('click', '.remove-edit-specializare', function () {
        $(this).closest('.edit-specializari-extra-group').remove();
    });
    $(document).on('click', '.remove-specializare', function () {
        $(this).closest('.specializari-extra-group').remove();
    });

    // Event listener pentru butonul de resetare a formularului
    $('#formAdaugaDepartament').on('reset', function () {
        $('.specializari-extra-group').remove();
    });

    // Event listener pentru editarea unui departament existent
    $(document).on('click', '.edit-btn', function () {
        var id_departament = $(this).data('id');

        $.ajax({
            url: '/get_departament/' + id_departament,
            type: 'GET',
            success: function (departament) {
                $('#edit_id_departament').val(departament.id_departament);
                $('#edit_facultate').val(departament.facultate);
                $('#edit_nume_departament').val(departament.nume_departament);
                $('#edit_sef_departament').val(departament.sef_departament);
                $('#edit_cod_unic').val(departament.cod_unic);

                var specializari = departament.specializari.split(', ');
                $('.edit-specializari-extra-group').remove();
                specializari.forEach(function (specializare, index) {
                    if (index === 0) {
                        $('#edit_specializari').val(specializare);
                    } else {
                        var newInputGroup = $('<div/>', {
                            'class': 'input-group mt-2 edit-specializari-extra-group'
                        }).append($('<input/>', {
                            'type': 'text',
                            'class': 'form-control edit-specializari-extra',
                            'name': 'edit_specializari[]',
                            'value': specializare
                        })).append($('<button/>', {
                            'type': 'button',
                            'class': 'btn btn-danger btn-sm remove-edit-specializare',
                            'html': '<i class="bi bi-x-lg"></i>'
                        }));

                        $('#edit_specializari').after(newInputGroup);
                    }
                });
            },
            error: function () {
                alert('Eroare la preluarea datelor departamentului.');
            }
        });
    });
    //

    $('#formEditareDepartament').submit(function (e) {
        e.preventDefault();

        var id_departament = $('#edit_id_departament').val();
        var specializariEditate = [$('#edit_specializari').val()];
        $('.edit-specializari-extra').each(function () {
            specializariEditate.push($(this).val());
        });

        var sefDepartamentSelectat = $('#edit_sef_departament_selectize input').val();

        var departamentEditat = {
            facultate: $('#edit_facultate').val(),
            nume_departament: $('#edit_nume_departament').val(),
            sef_departament: sefDepartamentSelectat,
            cod_unic: $('#edit_cod_unic').val(),
            specializari: specializariEditate.filter(Boolean).join(', ')
        };

        $.ajax({
            url: '/update_departament/' + id_departament,
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(departamentEditat),
            success: function (response) {
                alert('Departament actualizat cu succes.');
                $('#modalEditareDepartament').modal('hide');
                incarcaDepartamente();
            },
            error: function () {
                alert('Eroare la actualizarea departamentului.');
            }
        });
    });


    // Event listener pentru ștergerea unui departament
    $(document).on('click', '.delete-btn', function () {
        let id_departament = $(this).data('id');
        if (confirm('Ești sigur ca vrei sa ștergi acest departament?')) {
            $.ajax({
                url: '/sterge_departament/' + id_departament,
                type: 'DELETE',
                success: function (response) {
                    alert('Departament șters cu succes.');
                    incarcaDepartamente();
                },
                error: function () {
                    alert('Eroare la ștergerea departamentului.');
                }
            });
        }
    });

    incarcaDepartamente();
    incarcaProfesori();

});


