// Validación visual del formulario y feedback de envío
document.addEventListener('DOMContentLoaded', function() {
    // Statistics animation
    const animateStatistics = () => {
        const statSection = document.querySelector('.stat-number')?.closest('section');
        if (!statSection) return;

        const statNumbers = document.querySelectorAll('.stat-number');
        let animated = false;

        const animateNumbers = () => {
            if (animated) return;

            const sectionTop = statSection.getBoundingClientRect().top;
            const windowHeight = window.innerHeight;

            if (sectionTop < windowHeight * 0.75) {
                animated = true;

                statNumbers.forEach(stat => {
                    const originalText = stat.textContent;
                    const hasPlus = originalText.includes('+');
                    const finalValue = parseInt(originalText.replace(/[^\d]/g, ''));
                    let startValue = 0;
                    const duration = 2000; // 2 seconds
                    const increment = Math.ceil(finalValue / (duration / 50)); // Update every 50ms

                    stat.textContent = '0';
                    stat.classList.add('animated');

                    const timer = setInterval(() => {
                        startValue += increment;
                        if (startValue >= finalValue) {
                            clearInterval(timer);
                            startValue = finalValue;
                            stat.textContent = hasPlus ? `+${finalValue}` : `${finalValue}`;
                        } else {
                            stat.textContent = hasPlus ? `+${startValue}` : `${startValue}`;
                        }
                    }, 50);
                });
            }
        };

        // Check on scroll
        window.addEventListener('scroll', animateNumbers);
        // Check on initial load
        setTimeout(animateNumbers, 500);
    };

    // Initialize statistics animation
    animateStatistics();

    // Form validation
    document.getElementById('contactForm').addEventListener('submit', function(e) {
        // Solo prevenimos el envío del formulario inicialmente para validar
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
            // Si hay errores, no permitimos el envío del formulario
            return false;
        } else {
            // Si no hay errores, permitimos que el formulario se envíe normalmente
            // lo que hará que el navegador redirija a la página especificada en el atributo action
            this.submit();
        }
    });

    // Testimonial carousel functionality
    const initTestimonialCarousel = () => {
        const slides = document.querySelectorAll('.testimonial-slide');
        const indicators = document.querySelectorAll('.testimonial-indicators button');
        let currentSlide = 0;
        let interval;

        // Function to show a specific slide
        const showSlide = (index) => {
            // Hide all slides
            slides.forEach(slide => slide.classList.add('hidden'));
            // Show the selected slide
            slides[index].classList.remove('hidden');

            // Update indicators
            indicators.forEach(indicator => {
                indicator.classList.add('opacity-40');
                indicator.classList.remove('opacity-100');
            });
            indicators[index].classList.remove('opacity-40');
            indicators[index].classList.add('opacity-100');

            currentSlide = index;
        };

        // Set up automatic rotation
        const startCarousel = () => {
            // Clear any existing interval first
            if (interval) {
                clearInterval(interval);
            }

            interval = setInterval(() => {
                let nextSlide = (currentSlide + 1) % slides.length;
                showSlide(nextSlide);
            }, 5000); // Change slide every 5 seconds
        };

        // Add click event to indicators
        indicators.forEach((indicator, index) => {
            // Remove any existing event listeners first to prevent duplicates
            const newIndicator = indicator.cloneNode(true);
            indicator.parentNode.replaceChild(newIndicator, indicator);

            // Add the click event listener
            newIndicator.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                console.log('Indicator clicked:', index);
                clearInterval(interval); // Reset the interval when manually changing slides
                showSlide(index);
                startCarousel(); // Restart the automatic rotation
            });
        });

        // Initialize with the first slide
        showSlide(0);

        // Start the carousel
        startCarousel();

        // Log for debugging
        console.log('Carousel initialized with', slides.length, 'slides and', indicators.length, 'indicators');
    };

    // Initialize the carousel if it exists on the page, with a small delay to ensure DOM is ready
    if (document.querySelector('.testimonial-carousel')) {
        console.log('Testimonial carousel found, initializing...');
        // Small delay to ensure DOM is fully loaded
        setTimeout(() => {
            initTestimonialCarousel();
        }, 100);
    } else {
        console.log('No testimonial carousel found on this page');
    }
});
