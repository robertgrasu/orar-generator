       $(document).ready(function () {
            var currentPage = 1;

            var termenCautare = '';
            $('#cautareProfesor').on('keypress', function (e) {
                termenCautare = $(this).val();
                if (e.which == 13) {
                    e.preventDefault();
                    incarcaProfesori(1, termenCautare);
                }
            });
            function initializeDepartamentSelectize() {
                $.ajax({
                    url: '/get_departamente', // Presupunând că acesta este URL-ul care returnează departamentele
                    type: 'GET',
                    success: function (data) {
                        $('#departament_selectize, #edit_departament_selectize').selectize({
                            options: data.departamente.map(function (departament) {
                                return { value: departament.nume_departament, text: departament.nume_departament };
                            }),
                            create: false,
                            sortField: 'text',
                            maxItems: 1
                        });
                    }
                });
            }

            initializeDepartamentSelectize();
            $('#modalEditareProfesor').on('shown.bs.modal', function () {
                initializeDepartamentSelectize();
            });

            $('table').on('click', '.delete-btn', function () {
                var id = $(this).data('id');
                if (confirm('Ești sigur că vrei să ștergi acest profesor?')) {
                    $.ajax({
                        url: '/sterge_profesor/' + id,
                        type: 'DELETE',
                        success: function (response) {
                            alert("Profesor șters cu succes.");
                            // Reîncarcă lista profesorilor sau actualizează tabelul
                            incarcaProfesori(); // Funcția ta de reîncărcare a profesorilor
                        },
                        error: function () {
                            alert("Eroare la ștergerea profesorului.");
                        }
                    });
                }
            });
            var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'))
            var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
                $(tooltipTriggerEl).removeAttr('title'); // Elimină titlul nativ
                return new bootstrap.Tooltip(tooltipTriggerEl);
            });


            function incarcaProfesori(page, termen_cautare = '') {
                $.ajax({
                    url: '/get_profesori?page=' + page + '&cautare=' + termen_cautare,
                    type: 'GET',
                    success: function (response) {
                        var tbody = $('table tbody');
                        tbody.empty();
                        response.profesori.forEach(function (profesor) {
                            var row = '<tr>' +
                                '<td>' + profesor.id_profesor + '</td>' +
                                '<td>' + profesor.nume + '</td>' +
                                '<td>' + profesor.prenume + '</td>' +
                                '<td>' + profesor.departament + '</td>' +
                                '<td>' + profesor.facultate + '</td>' +
                                '<td align="center"><button class="btn btn-sm btn-info view-detalii-btn btn-grey" data-id="' + profesor.id_profesor + '" data-bs-toggle="tooltip" data-bs-html="true" data-bs-title="Încărcare..." title=""><i class="bi bi-eye-fill"></i></button></td>' +
                                '<td>' + profesor.email + '</td>' +
                                '<td>' + profesor.telefon + '</td>' +
                                '<td>' +
                                '<div class="btn-group-inline">' +
                                '<button class="btn btn-secondary btn-sm edit-btn" data-id="' + profesor.id_profesor + '" data-bs-toggle="modal" data-bs-target="#modalEditareProfesor">' +
                                '<i class="bi bi-pencil-square"></i>' +
                                '</button>' +
                                '<button class="btn btn-danger btn-sm delete-btn" data-id="' + profesor.id_profesor + '">' +
                                '<i class="bi bi-trash-fill"></i>' +
                                '</button>' +
                                '</div>' +
                                '</td>' +


                                '</tr>';
                            tbody.append(row);
                        });
                        updatePaginationButtons(response.total, page);

                        //                     $('table').on('click', '.view-disponibilitate-btn', function() {
                        //     var disponibilitate = $(this).data('disponibilitate');
                        //     $('#disponibilitateModalBody').text(disponibilitate);
                        //     $('#disponibilitateModal').modal('show');
                        // });
                        //                     var modalDeschisPrinMouseEnter = false;


                        var cursorPesteButon = false;
                        var modalDeschis = false;
                        var idProfesorCurent = null; // ID-ul profesorului curent pentru modal

                        function deschideModalDetalii(id) {
                            if (!modalDeschis || idProfesorCurent !== id) {
                                $.ajax({
                                    url: '/get_profesor/' + id,
                                    type: 'GET',
                                    success: function (profesor) {
                                        var modalContent = formatDisponibilitate(profesor.disponibilitate) +
                                            '<br>Email: ' + profesor.email +
                                            '<br>Telefon: ' + profesor.telefon;
                                        $('#disponibilitateModalBody').html(modalContent);
                                        $('#disponibilitateModal').modal('show');
                                        modalDeschis = true;
                                        idProfesorCurent = id;
                                    },
                                    error: function () {
                                        alert("Eroare la încărcarea detaliilor profesorului.");
                                    }
                                });
                            }
                        }

                        // Inițializare tooltip-uri
                        $('[data-bs-toggle="tooltip"]').each(function () {
                            var tooltip = new bootstrap.Tooltip(this, {
                                html: true,
                                trigger: 'manual'
                            });
                            $(this).data('bs.tooltip', tooltip);
                        });

                        // Handler pentru mouseenter
                        $('table').on('mouseenter', '.view-detalii-btn', function () {
                            var btn = this;
                            var tooltip = $(btn).data('bs.tooltip');
                            var id = $(btn).data('id');

                            // Închide toate tooltip-urile deschise înainte de a deschide unul nou
                            $('[data-bs-toggle="tooltip"]').not(btn).each(function () {
                                $(this).data('bs.tooltip').hide();
                            });

                            setTimeout(function () {
                                if ($(btn).is(':hover')) {
                                    $.ajax({
                                        url: '/get_profesor/' + id,
                                        type: 'GET',
                                        success: function (profesor) {
                                            var detalii = formatDisponibilitate(profesor.disponibilitate) +
                                                '<br>Email: ' + profesor.email +
                                                '<br>Telefon: ' + profesor.telefon;
                                            tooltip.setContent({ '.tooltip-inner': detalii });
                                            tooltip.show();
                                        },
                                        error: function () {
                                            tooltip.setContent({ '.tooltip-inner': 'Eroare la încărcarea detaliilor.' });
                                            tooltip.show();
                                        }
                                    });
                                }
                            }, 200);
                        });

                        // Handler pentru mouseleave
                        $('table').on('mouseleave', '.view-detalii-btn', function () {
                            var tooltip = $(this).data('bs.tooltip');
                            tooltip.hide();
                        });






                        $('table').on('click', '.view-detalii-btn', function () {
                            var id = $(this).data('id');
                            $.ajax({
                                url: '/get_profesor/' + id,
                                type: 'GET',
                                success: function (profesor) {
                                    $('#disponibilitateModalBody').html(formatDisponibilitate(profesor.disponibilitate) +
                                        '<br>Email: ' + profesor.email +
                                        '<br>Telefon: ' + profesor.telefon);
                                    $('#disponibilitateModal').modal('show');
                                },
                                error: function () {
                                    alert("Eroare la încărcarea detaliilor profesorului.");
                                }
                            });
                        });


                        // $('table').on('mouseenter', '.view-disponibilitate-btn', function(e) {
                        //     var disponibilitate = $(this).data('disponibilitate');
                        //     $('#hoverModalBody').text(disponibilitate);
                        //
                        //     $('#hoverModal').css({
                        //         display: 'block',
                        //         top: e.pageY + 'px', // poziționează modalul lângă cursor
                        //         left: e.pageX + 'px'
                        //     });
                        // }).on('mouseleave', '.view-disponibilitate-btn', function() {
                        //     $('#hoverModal').hide();
                        // });

                        // actualizează butoanele de paginare
                        updatePaginationButtons(response.total, page);
                    },
                    error: function () {
                        alert("Eroare la încărcarea profesorilor.");
                    }
                });
            }
            $('#butonCautare').click(function () {
                termenCautare = $('#cautareProfesor').val();
                currentPage = 1;
                incarcaProfesori(currentPage, termenCautare);
            });
            function formatDisponibilitate(disponibilitate) {
                if (disponibilitate === 'zilnic') {
                    return 'Profesorul este disponibil: zilnic';
                } else {
                    var disponibilitateFormatata = disponibilitate.split(',').map(function (disp) {
                        var [zi, ore] = disp.split('_');
                        return zi + ': ' + ore;
                    }).join('<br>');
                    return 'Profesorul este disponibil:<br>' + disponibilitateFormatata;
                }
            }

            function verificaDisponibilitate(selectElement, isEdit = false) {
                var divId = isEdit ? 'edit_disponibilitatePersonalizata' : 'disponibilitatePersonalizata';
                var value = $(selectElement).val();
                if (value === 'personalizat') {
                    $('#' + divId).show();
                } else {
                    $('#' + divId).hide();
                }
            }

            // Atașarea evenimentului 'change' la select-ul pentru disponibilitate (formular adăugare)
            $('#disponibilitate').change(function () {
                verificaDisponibilitate(this);
            });

            // Atașarea evenimentului 'change' la select-ul pentru disponibilitate (formular editare)
            $('#edit_disponibilitate').change(function () {
                verificaDisponibilitate(this, true);
            });

            function updatePaginationButtons(total, currentPage) {
                var totalPages = Math.ceil(total / 10);
                var pagination = $('.pagination');
                pagination.empty();

                for (var i = 1; i <= totalPages; i++) {
                    var liClass = currentPage === i ? 'page-item active' : 'page-item';
                    var button = `<li class="${liClass}"><a class="page-link" href="#">${i}</a></li>`;
                    pagination.append(button);
                }
            }


            // incarcaProfesori(currentPage);

            // $('.pagination').on('click', 'a', function(e) {
            //     e.preventDefault();
            //     var page = $(this).text();
            //     currentPage = parseInt(page);
            //     incarcaProfesori(currentPage);
            // });
            $('.pagination').on('click', 'a', function (e) {
                e.preventDefault();
                var page = $(this).text();
                currentPage = parseInt(page);
                incarcaProfesori(currentPage, termenCautare);
            });

            // Funcție pentru verificarea si afișarea campurilor de disponibilitate personalizata
            function verificaDisponibilitate(selectElement, isEdit = false) {
                var divId = isEdit ? 'edit_disponibilitatePersonalizata' : 'disponibilitatePersonalizata';
                if (selectElement.value === 'personalizat') {
                    $('#' + divId).show();
                } else {
                    $('#' + divId).hide();
                }
            }

            // Functie pentru obținerea disponibilitatii personalizate
            function obtineDisponibilitatePersonalizata() {
                var disponibilitati = [];
                ['luni', 'marti', 'miercuri', 'joi', 'vineri', 'sambata', 'duminica'].forEach(function (zi) {
                    var ora = $('#' + zi).val();
                    if (ora) {
                        disponibilitati.push(zi.charAt(0).toUpperCase() + zi.slice(1) + "_" + ora);
                    }
                });
                return disponibilitati.join(',');
            } function getSelectedDepartamentName(selectizeId) {
                return $('#' + selectizeId)[0].selectize.getItem($('#' + selectizeId)[0].selectize.getValue()).text();
            }
            function getSelectedDepartamentId(selectizeId) {
                return $('#' + selectizeId)[0].selectize.getValue();
            }
            // Adăugarea unui profesor nou
            $('#formAdaugaProfesor').submit(function (e) {
                e.preventDefault();
                var disponibilitate = $('#disponibilitate').val() === 'personalizat' ? obtineDisponibilitatePersonalizata() : 'zilnic';
                var departamentNume = getSelectedDepartamentName('departament_selectize');
                var facultate = $('#facultate').val();

                var profesorNou = {
                    nume: $('#nume').val(),
                    prenume: $('#prenume').val(),
                    departament: departamentNume,
                    facultate: $('#facultate').val(),
                    disponibilitate: disponibilitate,
                    email: $('#email').val(),
                    telefon: $('#telefon').val()
                };

                $.ajax({
                    url: '/adauga_profesor',
                    type: 'POST',
                    contentType: 'application/json',
                    data: JSON.stringify(profesorNou),
                    success: function (response) {
                        alert("Profesor adăugat cu succes.");
                        $('#formAdaugaProfesor').trigger("reset");
                        incarcaProfesori(currentPage);
                    },
                    error: function () {
                        alert("Eroare la adăugarea profesorului.");
                    }
                });
            });
            $('#formAdaugaProfesor').on('reset', function () {
                $('#disponibilitatePersonalizata').hide();
                $('#disponibilitate').val('');

            });

            // Editarea unui profesor existent
            $('table').on('click', '.edit-btn', function () {
                var id = $(this).data('id');
                $.ajax({
                    url: '/get_profesor/' + id,
                    type: 'GET',
                    success: function (profesor) {
                        $('#edit_id_profesor').val(profesor.id_profesor);
                        $('#edit_nume').val(profesor.nume);
                        $('#edit_prenume').val(profesor.prenume);
                        $('#edit_departament_selectize')[0].selectize.setValue(profesor.departament);
                        $('#edit_facultate').val(profesor.facultate); // Setează facultatea
                        $('#edit_email').val(profesor.email); // Setează email
                        $('#edit_telefon').val(profesor.telefon); // Setează număr de telefon
                        seteazaDisponibilitate(profesor.disponibilitate);
                    },
                    error: function () {
                        alert("Eroare la încărcarea detaliilor profesorului.");
                    }
                });
            });
            function curataDisponibilitatePersonalizata() {
                var zile = ['luni', 'marti', 'miercuri', 'joi', 'vineri', 'sambata', 'duminica'];
                zile.forEach(function (zi) {
                    $('#edit_' + zi).val('');
                });
            }
            // Funcție pentru setarea disponibilității în formularul de editare
            function seteazaDisponibilitate(disponibilitate) {
                if (disponibilitate.includes('_')) {
                    $('#edit_disponibilitate').val('personalizat');
                    verificaDisponibilitate(document.getElementById('edit_disponibilitate'), true);
                    disponibilitate.split(',').forEach(function (disp) {
                        var [zi, ore] = disp.split('_');
                        $('#edit_' + zi.toLowerCase()).val(ore);
                    });
                } else {
                    $('#edit_disponibilitate').val(disponibilitate || 'zilnic');
                    verificaDisponibilitate(document.getElementById('edit_disponibilitate'), true);
                    curataDisponibilitatePersonalizata();
                }
            }

            // Salvarea modificarilor pentru un profesor existent
            $('#formEditareProfesor').submit(function (e) {
                e.preventDefault();
                var id = $('#edit_id_profesor').val();
                var disponibilitate = $('#edit_disponibilitate').val() === 'personalizat' ? obtineDisponibilitatePersonalizataEdit() : 'zilnic';
                var departamentNume = getSelectedDepartamentName('edit_departament_selectize'); // Obține numele departamentului selectat

                var profesorEditat = {
                    nume: $('#edit_nume').val(),
                    prenume: $('#edit_prenume').val(),
                    departament: departamentNume, // Folosește numele departamentului
                    facultate: $('#edit_facultate').val(), // Obțineți valoarea selectată pentru facultate
                    disponibilitate: disponibilitate,
                    email: $('#edit_email').val(),
                    telefon: $('#edit_telefon').val()
                };

                $.ajax({
                    url: '/update_profesor/' + id,
                    type: 'POST',
                    contentType: 'application/json',
                    data: JSON.stringify(profesorEditat),
                    success: function (response) {
                        alert("Profesor actualizat cu succes.");
                        $('#modalEditareProfesor').modal('hide');
                        incarcaProfesori(currentPage);
                    },
                    error: function () {
                        alert("Eroare la actualizarea profesorului.");
                    }
                });
            });


            // Functie pentru obținerea disponibilității personalizate la editare
            function obtineDisponibilitatePersonalizataEdit() {
                var disponibilitati = [];
                ['luni', 'marti', 'miercuri', 'joi', 'vineri', 'sambata', 'duminica'].forEach(function (zi) {
                    var ora = $('#edit_' + zi).val();
                    if (ora) {
                        disponibilitati.push(zi.charAt(0).toUpperCase() + zi.slice(1) + "_" + ora);
                    }
                });
                return disponibilitati.join(',');
            }

            // Inițializeaza incărcarea profesorilor
            incarcaProfesori(currentPage);
        });
