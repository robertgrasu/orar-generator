        $(document).ready(function () {
    const numarPePagina = 10;
    function initializeSpecializareSelectize() {
        $.ajax({
            url: '/get_specializari',
            type: 'GET',
            success: function(data) {
                $('#specializare_selectize').selectize({
                    options: data.map(function(specializare) {
                        return { value: specializare, text: specializare };
                    }),
                    create: false,
                    sortField: 'text',
                    maxItems: 1
                });
                $('#edit_specializare_selectize').selectize({
                    options: data.map(function(specializare) {
                        return { value: specializare, text: specializare };
                    }),
                    create: false,
                    sortField: 'text',
                    maxItems: 1
                });
            },
            error: function(error) {
                console.log('Eroare la încărcarea specializărilor: ' + error.responseText);
            }
        });
    }

    function initializeDepartamentSelectize() {
        $.ajax({
            url: '/get_departamente',
            type: 'GET',
            success: function(data) {
                $('#departament_selectize').selectize({
                    options: data.departamente.map(function(departament) {
                        return { value: departament.id_departament, text: departament.nume_departament };
                    }),
                    create: false,
                    sortField: 'text',
                    maxItems: 1
                });
                $('#edit_departament_selectize').selectize({
                    options: data.departamente.map(function(departament) {
                        return { value: departament.id_departament, text: departament.nume_departament };
                    }),
                    create: false,
                    sortField: 'text',
                    maxItems: 1
                });
            }
        });
    }
function creeazaButoanePaginare(totalGrupe, paginaCurenta) {
    const numarPagini = Math.ceil(totalGrupe / numarPePagina);
    const paginatie = $('.pagination');
    paginatie.empty();

    for (let i = 1; i <= numarPagini; i++) {
        const li = $('<li class="page-item ' + (i === paginaCurenta ? 'active' : '') + '"></li>');
        const a = $('<a class="page-link" href="#">').text(i);
        a.on('click', function (e) {
            e.preventDefault();
            incarcaGrupe(i);
        });
        li.append(a);
        paginatie.append(li);
    }
}

    // Funcție pentru încărcarea și afișarea grupelor
function incarcaGrupe(paginaCurenta = 1) {
    $.ajax({
        url: '/get_grupuri',
        type: 'GET',
        data: { page: paginaCurenta, per_page: numarPePagina },
success: function(response) {
    var totalGrupe = response.total;
    creeazaButoanePaginare(totalGrupe, paginaCurenta);

    var listaGrupe = $('#listaGrupe');
    listaGrupe.empty();
    var tabel = $('<table>').addClass('table table-striped table-hover');
    var thead = $('<thead>').html('<tr><th>Cod Grupă</th><th>Departament</th><th>Facultate</th><th>Specializare</th><th>An Studiu</th><th>Număr Studenți</th><th>Studenți Buget</th><th>Studenți Taxă</th><th>Acțiuni</th></tr>');
    var tbody = $('<tbody>');

    response.grupuri.forEach(function(grupa) {
                    var tr = $('<tr>').append(
                        $('<td>').text(grupa.cod_grupa),
                        $('<td>').text(grupa.nume_departament ? grupa.nume_departament : ''),
                        $('<td>').text(grupa.facultate ? grupa.facultate : ''),
                        $('<td>').text(grupa.specializare),
                        $('<td>').text(grupa.an_studiu),
                        $('<td>').text(grupa.numar_studenti),
                        $('<td>').text(grupa.studenti_buget),
                        $('<td>').text(grupa.studenti_taxa),
                        $('<td>').append(
                            $('<div>').addClass('action-btns').append(
                                $('<button>').addClass('btn btn-secondary btn-sm edit-btn').attr('data-id', grupa.id_grupa).html('<i class="bi bi-pencil-square"></i>'),
                                $('<button>').addClass('btn btn-danger btn-sm delete-btn').attr('data-id', grupa.id_grupa).html('<i class="bi bi-trash-fill"></i>')
                        ))
                    );
                    tbody.append(tr);
                });

                tabel.append(thead).append(tbody);
                listaGrupe.append(tabel);
            },
            error: function(error) {
                alert('Eroare la încărcarea grupelor: ' + error.responseText);
            }
        });
    }

    // Adăugarea unei noi grupe
    $('#formAdaugaGrupa').submit(function(e) {
        e.preventDefault();

        var grupa = {
            cod_grupa: $('#cod_grupa').val(),
            departament: $('#departament_selectize').val(),
            facultate: $('#facultate').val(),
            specializare: $('#specializare_selectize').val(),
            an_studiu: $('#an_studiu').val(),
            numar_studenti: $('#numar_studenti').val(),
            studenti_buget: $('#studenti_buget').val(),
            studenti_taxa: $('#studenti_taxa').val()
        };

        $.ajax({
            url: '/adauga_grupa',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(grupa),
            success: function(response) {
                alert("Grupă adăugată cu succes.");
                $('#formAdaugaGrupa').trigger('reset');
                incarcaGrupe();
            },
            error: function(error) {
                alert("Eroare la adăugarea grupei: " + error.responseText);
            }
        });
    });

    $('#formAdaugaGrupa').on('reset', function() {
        // Resetarea controlului Selectize
        $('#departament_selectize')[0].selectize.clear();
        $('#specializare_selectize')[0].selectize.clear();

        // Aici poți adăuga alte acțiuni necesare pentru resetarea formularului
    });

    // Event listener pentru butoanele de editare
    $(document).on('click', '.edit-btn', function() {
        var id_grupa = $(this).data('id');
        $.ajax({
            url: '/get_grupa/' + id_grupa,
            type: 'GET',
            success: function(grupa) {
                $('#edit_id_grupa').val(grupa.id_grupa);
                $('#edit_cod_grupa').val(grupa.cod_grupa);
                $('#edit_departament_selectize')[0].selectize.setValue(grupa.id_departament);
                $('#edit_facultate').val(grupa.facultate);
                $('#edit_specializare_selectize')[0].selectize.setValue(grupa.specializare);
                $('#edit_an_studiu').val(grupa.an_studiu);
                $('#edit_numar_studenti').val(grupa.numar_studenti);
                $('#edit_studenti_buget').val(grupa.studenti_buget);
                $('#edit_studenti_taxa').val(grupa.studenti_taxa);
                $('#modalEditareGrupa').modal('show');
            },
            error: function(error) {
                alert("Eroare la obținerea datelor grupei: " + error.responseText);
            }
        });
    });

    // Event listener pentru salvarea modificărilor unei grupe
    $('#updateGrupaBtn').click(function() {
        var id_grupa = $('#edit_id_grupa').val();
        var updatedData = {
            cod_grupa: $('#edit_cod_grupa').val(),
            departament: $('#edit_departament_selectize').val(),
            facultate: $('#edit_facultate').val(),
            specializare: $('#edit_specializare_selectize').val(),
            an_studiu: $('#edit_an_studiu').val(),
            numar_studenti: $('#edit_numar_studenti').val(),
            studenti_buget: $('#edit_studenti_buget').val(),
            studenti_taxa: $('#edit_studenti_taxa').val()
        };

        $.ajax({
            url: '/update_grupa/' + id_grupa,
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(updatedData),
            success: function(response) {
                alert("Grupă actualizată cu succes.");
                $('#modalEditareGrupa').modal('hide');
                incarcaGrupe();
            },
            error: function(error) {
                alert("Eroare la actualizarea grupei: " + error.responseText);
            }
        });
    });

    // Event listener pentru ștergerea unei grupe
    $(document).on('click', '.delete-btn', function() {
        var id_grupa = $(this).data('id');
        if (confirm("Ești sigur că vrei să ștergi această grupă?")) {
            $.ajax({
                url: '/sterge_grupa/' + id_grupa,
                type: 'DELETE',
                success: function(response) {
                    alert("Grupă ștearsă cu succes.");
                    incarcaGrupe();
                },
                error: function(error) {
                    alert("Eroare la ștergerea grupei: " + error.responseText);
                }
            });
        }
    });

    incarcaGrupe();
    initializeDepartamentSelectize();
    initializeSpecializareSelectize();
});
