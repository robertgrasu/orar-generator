        $(document).ready(function () {
            let saliExistente = [];
            let saliPePagina = 10;
            let paginaCurenta = 1;
            let filtruCorp = '';
            // Listener pentru butoanele de editare
            $('#listaSali').on('click', '.edit-btn', function () {
                const id_sala = $(this).data('id');
                editSala(id_sala);
            });
            function getSali() {
                $.ajax({
                    url: '/get_sali',
                    type: 'GET',
                    data: {
                        corp: filtruCorp,
                        limit: saliPePagina,
                        offset: (paginaCurenta - 1) * saliPePagina
                    },
                    success: function (data) {
                        saliExistente = data.sali;
                        afiseazaSali();
                        afiseazaPaginare(data.total);
                    },
                    error: function () {
                        alert('Eroare la preluarea sălilor.');
                    }
                });
            }

    function afiseazaSali() {
        var tbody = $('#listaSali table tbody');
        tbody.empty();
        $.each(saliExistente, function (index, sala) {
            var row = '<tr>' +
                '<td class="text-center">' + sala.id_sala + '</td>' +
                '<td class="text-center">' + sala.identificator_unic + '</td>' +
                '<td class="text-center">' + sala.corp + '</td>' +
                '<td class="text-center">' + sala.etaj + '</td>' +
                '<td class="text-center">' + sala.numar_sala + '</td>' +
                '<td class="text-center">' + sala.capacitate + '</td>' +
                '<td class="text-center">' + sala.tip_sala + '</td>' +
                '<td>' +
                '<button class="btn btn-secondary btn-sm edit-btn" data-id="' + sala.id_sala + '">' +
                '<i class="bi bi-pencil-square"></i>' +
                '</button>' +
                '<button class="btn btn-danger btn-sm delete-btn" data-id="' + sala.id_sala + '">' +
                '<i class="bi bi-trash-fill"></i>' +
                '</button>' +
                '</td>' +
                '</tr>';
            tbody.append(row);
        });
    }
// function afiseazaSali() {
//     var tbody = $('#listaSali table tbody');
//     tbody.empty();
//     var numarCurent = (paginaCurenta - 1) * saliPePagina + 1;
//     saliExistente.forEach(function (sala) {
//         var row = `
//             <tr>
//                 <td class="text-center">${numarCurent++}</td>
//                 <td>${sala.identificator_unic}</td>
//                 <td>${sala.corp}</td>
//                 <td>${sala.etaj}</td>
//                 <td>${sala.numar_sala}</td>
//                 <td>${sala.capacitate}</td>
//                 <td>${sala.tip_sala}</td>
//                 <td>
//                     <button class="btn btn-secondary btn-sm edit-btn" data-id="${sala.id_sala}">Editează</button>
//                     <button class="btn btn-danger btn-sm delete-btn" data-id="${sala.id_sala}">Șterge</button>
//                 </td>
//             </tr>
//         `;
//         tbody.append(row);
//     });
// }

// Listener pentru butoanele de ștergere
$('#listaSali').on('click', '.delete-btn', function () {
    const id_sala = $(this).data('id');
    if (confirm('Ești sigur că vrei să ștergi această sală?')) {
        $.ajax({
            url: '/delete_sala/' + id_sala,
            type: 'POST',
            success: function (response) {
                alert(response.message);
                getSali();
            },
            error: function () {
                alert('Eroare la ștergerea sălii.');
            }
        });
    }
});
            function afiseazaPaginare(totalSali) {
                let totalPagini = Math.ceil(totalSali / saliPePagina);
                let paginareHTML = '';
                for (let i = 1; i <= totalPagini; i++) {
                    paginareHTML += `
            <li class="page-item ${i === paginaCurenta ? 'active' : ''}">
                <button class="page-link" data-page="${i}">${i}</button>
            </li>
        `;
                }
                $('#paginare').html(paginareHTML);
            }

            // Listener pentru schimbarea paginii
   $('#paginare').on('click', '.page-link', function (e) {
        e.preventDefault();
        paginaCurenta = parseInt($(this).data('page'));
        getSali();
    });

function editSala(id_sala) {
    $('#edit_id_sala').val(id_sala);
    // Preluarea datelor sălii de la server
    $.ajax({
        url: '/get_sala/' + id_sala,
        type: 'GET',
        success: function (sala) {
            // Prelungirea datelor în formularul de editare
            $('#edit_corp').val(sala.corp);
            $('#edit_etaj').val(sala.etaj);
            $('#edit_numar_sala').val(sala.numar_sala);
            $('#edit_capacitate').val(sala.capacitate);

            // Resetare checkbox-uri
            $('#edit_tip_sala_curs').prop('checked', false);
            $('#edit_tip_sala_laborator').prop('checked', false);
            $('#edit_tip_sala_proiect').prop('checked', false);
            $('#edit_tip_sala_seminar').prop('checked', false);

            // Bifează checkbox-urile în funcție de datele sălii
            var tipuriSala = sala.tip_sala.split(', '); // Presupunem că tipurile de sală sunt separate prin virgulă și spațiu
            tipuriSala.forEach(function (tip) {
                if (tip === 'Curs') $('#edit_tip_sala_curs').prop('checked', true);
                if (tip === 'Laborator') $('#edit_tip_sala_laborator').prop('checked', true);
                if (tip === 'Proiect') $('#edit_tip_sala_proiect').prop('checked', true);
                if (tip === 'Seminar') $('#edit_tip_sala_seminar').prop('checked', true);
            });

            // Afișarea modalului de editare
            $('#modalEditareSala').modal('show');
        },
        error: function () {
            alert("Eroare la încărcarea detaliilor sălii.");
        }
    });
}

            function schimbaPagina(numarPagina) {
                paginaCurenta = numarPagina;
                getSali();
            }

    $('#selectCorp').change(function () {
        filtruCorp = $(this).val();
        paginaCurenta = 1;
        getSali();
    });

            $('#formAdaugaSala').submit(function (e) {
                e.preventDefault();
                    var tipuriSala = [];
                    if ($('#tip_sala_curs').is(':checked')) tipuriSala.push('Curs');
                    if ($('#tip_sala_laborator').is(':checked')) tipuriSala.push('Laborator');
                    if ($('#tip_sala_proiect').is(':checked')) tipuriSala.push('Proiect');
                    if ($('#tip_sala_seminar').is(':checked')) tipuriSala.push('Seminar');

                var salaData = {
                    corp: $('#corp').val(),
                    etaj: $('#etaj').val(),
                    numar_sala: $('#numar_sala').val(),
                    capacitate: $('#capacitate').val(),
                    tip_sala: tipuriSala.join(', ') // Salvăm tipurile de sală ca un string delimitat de virgulă
                };
                $.ajax({
                    url: '/adauga_sala',
                    type: 'POST',
                    contentType: 'application/json',
                    data: JSON.stringify(salaData),
                    success: function (response) {
                        alert(response.message);
                        getSali();
                    },
                    error: function () {
                        alert('Eroare la adăugarea sălii.');
                    }
                });
            });
            $('#btnResetForm').click(function () {
                // Resetează formularul
                $('#formAdaugaSala').trigger('reset');
            });
            $('#formEditareSala').submit(function (e) {
                e.preventDefault();

                var tipuriSala = [];
    if ($('#edit_tip_sala_curs').is(':checked')) tipuriSala.push('Curs');
    if ($('#edit_tip_sala_laborator').is(':checked')) tipuriSala.push('Laborator');
    if ($('#edit_tip_sala_proiect').is(':checked')) tipuriSala.push('Proiect');
    if ($('#edit_tip_sala_seminar').is(':checked')) tipuriSala.push('Seminar');
                var id_sala = $('#edit_id_sala').val();
                var editData = {
                    corp: $('#edit_corp').val(),
                    etaj: $('#edit_etaj').val(),
                    numar_sala: $('#edit_numar_sala').val(),
                    capacitate: $('#edit_capacitate').val(),
                    tip_sala: tipuriSala.join(', ')
                };
                $.ajax({
                    url: '/update_sala/' + id_sala,
                    type: 'POST',
                    contentType: 'application/json',
                    data: JSON.stringify(editData),
                    success: function (response) {
                        alert(response.message);
                        getSali();
                        $('#modalEditareSala').modal('hide');
                    },
                    error: function () {
                        alert('Eroare la actualizarea sălii.');
                    }
                });
            });
            $('#listaSali').on('click', '.edit-btn', function () {
                const id_sala = $(this).data('id');
                editSala(id_sala);
            });

            // Listener pentru schimbarea paginii
            $('#paginare').on('click', '.page-link', function (e) {
                e.preventDefault();
                const numarPagina = $(this).data('page');
                schimbaPagina(numarPagina);
            });
            getSali();
        });