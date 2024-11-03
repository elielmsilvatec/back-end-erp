


$(document).ready(function () {
    $('.telefone').mask('(00) 0000-0000');
});

$(document).ready(function () {
    $('.cep').mask('00000 - 000');
});


// confirmar antes de deletar (SweetAlert2)
function Alerta() {
    const swalWithBootstrapButtons = Swal.mixin({
        customClass: {
            confirmButton: 'btn btn-success mx-2',
            cancelButton: 'btn btn-danger mx-2'
        },
        buttonsStyling: false
    })

    swalWithBootstrapButtons.fire({
        title: 'Tem certeza?',
        text: "Você não será capaz de reverter isso!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sim, deletar este item!',
        cancelButtonText: 'Não, cancelar!',
        reverseButtons: true
    }).then((result) => {
        if (result.isConfirmed) {
            document.getElementById('deleteForm').submit();
            swalWithBootstrapButtons.fire(
                'Deletado!',
                'Seu arquivo foi deletado.',
                'success'
            )
        } else if (
            /* Read more about handling dismissals below */
            result.dismiss === Swal.DismissReason.cancel
        ) {
            swalWithBootstrapButtons.fire(
                'Cancelado',
                'Seus arquivos estão seguros :)',
                'error'
            )
        }
    })
}


// confirmar antes de deletar (SweetAlert2) usando classe
function AlertaClass(form) {
    const swalWithBootstrapButtons = Swal.mixin({
        customClass: {
            confirmButton: 'btn btn-success mx-2',
            cancelButton: 'btn btn-danger mx-2'
        },
        buttonsStyling: false
    })

    swalWithBootstrapButtons.fire({
        title: 'Tem certeza?',
        text: "Você não será capaz de reverter isso!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sim, deletar este item!',
        cancelButtonText: 'Não, cancelar!',
        reverseButtons: true
    }).then((result) => {
        if (result.isConfirmed) {
            form.submit();
            swalWithBootstrapButtons.fire(
                'Deletado!',
                'Seu arquivo foi deletado.',
                'success'
            )
        } else if (
            /* Read more about handling dismissals below */
            result.dismiss === Swal.DismissReason.cancel
        ) {
            swalWithBootstrapButtons.fire(
                'Cancelado',
                'Seus arquivos estão seguros :)',
                'error'
            )
        }
    })
}


// confirmar qualquer acão (SweetAlert2) usando classe
function Confirm(form) {
    const swalWithBootstrapButtons = Swal.mixin({
        customClass: {
            confirmButton: 'btn btn-success mx-2',
            cancelButton: 'btn btn-danger mx-2'
        },
        buttonsStyling: false
    })

    swalWithBootstrapButtons.fire({
        title: 'Tem certeza?',
        text: "Você não será capaz de reverter isso!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sim, tenho certeza!',
        cancelButtonText: 'Não, cancelar!',
        reverseButtons: true
    }).then((result) => {
        if (result.isConfirmed) {
            form.submit();
            swalWithBootstrapButtons.fire(
                'Confirmado!',
                'Seu arquivo foi alterado.',
                'success'
            )
        } else if (
            /* Read more about handling dismissals below */
            result.dismiss === Swal.DismissReason.cancel
        ) {
            swalWithBootstrapButtons.fire(
                'Cancelado',
                'Seus arquivos estão seguros :)',
                'error'
            )
        }
    })
}


function mostrarFormMobile() {
    const menu_mobile_mostar = document.querySelector('#navbarNav');
    

    // Verifica se o elemento está visível ou oculto
    if (menu_mobile_mostar.style.display === 'none') {
        // Se estiver oculto, exibe o elemento
        menu_mobile_mostar.style.display = 'block';
    } else {
        // Se estiver visível, oculta o elemento
        menu_mobile_mostar.style.display = 'none';
    }		
}


    

