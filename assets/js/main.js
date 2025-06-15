// Validación visual del formulario y feedback de envío
document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('contactForm').addEventListener('submit', function(e) {
        e.preventDefault();
        let hasError = false;
        const name = document.getElementById('name');
        const whatsapp = document.getElementById('whatsapp');
        const email = document.getElementById('email');
        const nameError = document.getElementById('nameError');
        const whatsappError = document.getElementById('whatsappError');
        const emailError = document.getElementById('emailError');
        [name, whatsapp, email].forEach(input => input.classList.remove('input-error'));
        [nameError, whatsappError, emailError].forEach(el => { el.innerText = ''; el.classList.add('hidden'); });
        if (!name.value.trim()) {
            nameError.innerText = 'Por favor, ingresa tu nombre completo.';
            nameError.classList.remove('hidden');
            name.classList.add('input-error');
            hasError = true;
        }
        if (!/^\d{9,13}$/.test(whatsapp.value.trim())) {
            whatsappError.innerText = 'Ingresa un número de WhatsApp válido.';
            whatsappError.classList.remove('hidden');
            whatsapp.classList.add('input-error');
            hasError = true;
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim())) {
            emailError.innerText = 'Ingresa un correo electrónico válido.';
            emailError.classList.remove('hidden');
            email.classList.add('input-error');
            hasError = true;
        }
        if (hasError) {
            e.preventDefault();
        }
        document.getElementById('formSuccess').innerText = '¡Gracias! Tu mensaje fue enviado. Te contactaremos pronto.';
        document.getElementById('formSuccess').classList.remove('hidden');
        this.reset();
        setTimeout(() => { document.getElementById('formSuccess').classList.add('hidden'); }, 3500);
    });
});