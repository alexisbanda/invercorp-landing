import React, { useState, useCallback, useEffect } from 'react';
import { ScaleIcon, CalculatorIcon, HeartHandshakeIcon, ChartBarIcon, LightBulbIcon } from './icons';

// --- Datos de servicios más detallados ---
const HERO_SERVICES_DETAILS = [
	{
		icon: <ChartBarIcon className="w-7 h-7 text-[#4CAF50]" />,
		title: 'Finanzas y Microcrédito',
		description:
			'Accede al capital semilla que tu idea necesita para despegar con nuestro respaldo.',
	},
	{
		icon: <LightBulbIcon className="w-7 h-7 text-[#4CAF50]" />,
		title: 'Emprendimiento',
		description:
			'Estructura tu plan de negocio de forma sólida y profesional para asegurar el éxito.',
	},
	{
		icon: <ScaleIcon className="w-7 h-7 text-[#4CAF50]" />,
		title: 'Asesoría Legal',
		description:
			'Navega el marco legal ecuatoriano con confianza. Te conectamos con expertos.',
	},
	{
		icon: <CalculatorIcon className="w-7 h-7 text-[#4CAF50]" />,
		title: 'Contabilidad Simplificada',
		description:
			'Mantén tus finanzas en orden y cumple con tus obligaciones fiscales sin estrés.',
	},
	{
		icon: <HeartHandshakeIcon className="w-7 h-7 text-[#4CAF50]" />,
		title: 'Apoyo Psicológico',
		description:
			'Fortalece tu bienestar emocional para enfrentar los retos del emprendimiento.',
	},
];

type FormErrors = {
	name?: string;
	whatsapp?: string;
	email?: string;
};

const Hero: React.FC = () => {
	const [name, setName] = useState('');
	const [whatsapp, setWhatsapp] = useState('');
	const [email, setEmail] = useState('');
	const [errors, setErrors] = useState<FormErrors>({});
	const [currentServiceIndex, setCurrentServiceIndex] = useState(0);

	// Efecto para el carrusel automático de servicios
	useEffect(() => {
		const timer = setInterval(() => {
			setCurrentServiceIndex((prevIndex) => (prevIndex + 1) % HERO_SERVICES_DETAILS.length);
		}, 5000); // Cambia de servicio cada 5 segundos
		return () => clearInterval(timer);
	}, []);

	const validate = useCallback(() => {
		const newErrors: FormErrors = {};
		if (!name.trim()) {
			newErrors.name = 'Por favor, ingresa tu nombre completo.';
		}
		if (!/^\+?\d{9,14}$/.test(whatsapp.trim())) {
			newErrors.whatsapp = 'Ingresa un número de WhatsApp válido (ej: 0991234567).';
		}
		if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
			newErrors.email = 'Ingresa un correo electrónico válido.';
		}
		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	}, [name, whatsapp, email]);

	const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
		if (!validate()) {
			event.preventDefault();
		}
	};

	return (
		<section className="bg-hero relative">
			<div className="container mx-auto px-6 py-10 md:py-16 relative z-10">
				<div className="grid md:grid-cols-2 gap-12 items-center">
					<div className="order-last md:order-first"></div>

					<div className="bg-white/95 backdrop-blur-sm p-8 rounded-2xl shadow-xl">
						<h1 className="text-3xl md:text-4xl font-bold text-[#2F4F4F] leading-tight mb-3 text-center">
							La semilla de tu emprendimiento,{' '}
							<span className="text-[#4CAF50]">en tierra fértil.</span>
						</h1>
						<p className="text-md text-gray-600 mb-6 text-center">
							Te ayudamos a crecer con fe, orden y el apoyo financiero que
							necesitas.
						</p>

						{/* --- INICIO: Carrusel de servicios REFINADO --- */}
						<div className="mb-8 text-center">
							{/* Contenedor con altura mínima para evitar solapamiento */}
							<div className="relative min-h-[10rem] md:min-h-[8rem] flex items-center justify-center">
								{HERO_SERVICES_DETAILS.map((service, index) => (
									<div
										key={service.title}
										className={`absolute w-full transition-opacity duration-700 ease-in-out ${
											index === currentServiceIndex
												? 'opacity-100'
												: 'opacity-0'
										}`}
									>
										<div className="flex flex-col items-center justify-center h-full">
											<div className="flex items-center gap-3 mb-2">
												<div className="bg-[#4CAF50]/15 p-2 rounded-full">
													{service.icon}
												</div>
												<h3 className="text-lg font-semibold text-[#2F4F4F]">
													{service.title}
												</h3>
											</div>
											<p className="text-sm text-gray-600 px-4 max-w-xs mx-auto">
												{service.description}
											</p>
										</div>
									</div>
								))}
							</div>
							{/* Indicadores (bullets) con espaciado garantizado */}
							<div className="flex justify-center space-x-2 pt-2">
								{HERO_SERVICES_DETAILS.map((_, index) => (
									<button
										key={index}
										onClick={() => setCurrentServiceIndex(index)}
										className={`w-2 h-2 rounded-full transition-all duration-300 ${
											index === currentServiceIndex
												? 'bg-[#4CAF50] scale-125'
												: 'bg-gray-300 hover:bg-gray-400'
										}`}
										aria-label={`Ir al servicio ${index + 1}`}
									/>
								))}
							</div>
						</div>
						{/* --- FIN: Carrusel de servicios REFINADO --- */}

						<form
							id="contactForm"
							name="contact"
							method="POST"
							action="/thanks.html"
							data-netlify="true"
							data-netlify-honeypot="bot-field"
							onSubmit={handleSubmit}
							noValidate
						>
							<input type="hidden" name="form-name" value="contact" />
							<p className="hidden">
								<label>
									No llenar este campo:{' '}
									<input name="bot-field" />
								</label>
							</p>

							<div className="mb-4">
								<label
									htmlFor="name"
									className="block text-gray-700 font-medium mb-2"
								>
									Nombre Completo
								</label>
								<input
									type="text"
									id="name"
									name="name"
									value={name}
									onChange={(e) => setName(e.target.value)}
									className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 ${
										errors.name
											? 'border-red-500 ring-red-300'
											: 'border-gray-300 focus:ring-[#4CAF50]'
									}`}
									placeholder="Ej: Andrea Pérez"
									required
									aria-invalid={!!errors.name}
									aria-describedby={
										errors.name ? 'name-error' : undefined
									}
								/>
								{errors.name && (
									<div
										id="name-error"
										className="error-text mt-1"
									>
										{errors.name}
									</div>
								)}
							</div>

							<div className="mb-4">
								<label
									htmlFor="whatsapp"
									className="block text-gray-700 font-medium mb-2"
								>
									Número de WhatsApp
								</label>
								<input
									type="tel"
									id="whatsapp"
									name="whatsapp"
									value={whatsapp}
									onChange={(e) => setWhatsapp(e.target.value)}
									className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 ${
										errors.whatsapp
											? 'border-red-500 ring-red-300'
											: 'border-gray-300 focus:ring-[#4CAF50]'
									}`}
									placeholder="Ej: 0991234567"
									required
									aria-invalid={!!errors.whatsapp}
									aria-describedby={
										errors.whatsapp ? 'whatsapp-error' : undefined
									}
								/>
								{errors.whatsapp && (
									<div
										id="whatsapp-error"
										className="error-text mt-1"
									>
										{errors.whatsapp}
									</div>
								)}
							</div>

							<div className="mb-6">
								<label
									htmlFor="email"
									className="block text-gray-700 font-medium mb-2"
								>
									Correo Electrónico
								</label>
								<input
									type="email"
									id="email"
									name="email"
									value={email}
									onChange={(e) => setEmail(e.target.value)}
									className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 ${
										errors.email
											? 'border-red-500 ring-red-300'
											: 'border-gray-300 focus:ring-[#4CAF50]'
									}`}
									placeholder="tu@correo.com"
									required
									aria-invalid={!!errors.email}
									aria-describedby={
										errors.email ? 'email-error' : undefined
									}
								/>
								{errors.email && (
									<div id="email-error" className="error-text mt-1">
										{errors.email}
									</div>
								)}
							</div>

							<button
								type="submit"
								className="w-full bg-[#4CAF50] text-white font-bold py-3 px-6 rounded-full cta-button text-lg flex items-center justify-center gap-2"
							>
								<span>🌱</span> Quiero mi asesoría gratuita
							</button>
							<p className="text-gray-500 mt-2 text-center text-sm">
								Respondemos en menos de 24h
							</p>

							<a
								href="https://wa.me/593993845713?text=Hola,%20quiero%20más%20información%20sobre%20INVERCOP%20y%20cómo%20pueden%20ayudarme%20a%20crecer."
								target="_blank"
								rel="noopener noreferrer"
								className="w-full bg-[#25D366] text-white font-bold py-3 px-6 rounded-full cta-button text-lg flex items-center justify-center gap-2 text-center"
								aria-label="Habla ahora por WhatsApp"
							>
								{/* Mejor icono SVG de WhatsApp para mejor compatibilidad */}
								<svg
									className="h-6 w-6"
									fill="currentColor"
									viewBox="0 0 24 24"
								>
									<path d="M20.52 3.48A12 12 0 0 0 12 0C5.37 0 0 5.37 0 12c0 2.11.55 4.17 1.6 5.98L0 24l6.18-1.62A11.94 11.94 0 0 0 12 24c6.63 0 12-5.37 12-12 0-3.19-1.24-6.19-3.48-8.52zM12 22c-1.85 0-3.66-.5-5.22-1.44l-.37-.22-3.67.96.98-3.58-.24-.37A9.94 9.94 0 0 1 2 12C2 6.48 6.48 2 12 2c2.65 0 5.15 1.03 7.03 2.91A9.93 9.93 0 0 1 22 12c0 5.52-4.48 10-10 10zm5.2-7.8c-.28-.14-1.65-.81-1.9-.9-.25-.09-.43-.14-.61.14-.18.28-.7.9-.86 1.08-.16.18-.32.2-.6.07-.28-.14-1.18-.44-2.25-1.4-.83-.74-1.39-1.65-1.55-1.93-.16-.28-.02-.43.12-.57.13-.13.28-.34.42-.51.14-.17.18-.29.28-.48.09-.19.05-.36-.02-.5-.07-.14-.61-1.47-.83-2.01-.22-.54-.44-.47-.61-.48-.16-.01-.36-.01-.56-.01-.19 0-.5.07-.76.36-.26.29-1 1-.98 2.43.02 1.43 1.03 2.81 1.18 3.01.15.2 2.03 3.1 4.93 4.23.69.27 1.23.43 1.65.55.69.22 1.32.19 1.81.12.55-.08 1.65-.67 1.88-1.32.23-.65.23-1.2.16-1.32-.07-.12-.25-.19-.53-.33z" />
								</svg>
								<span className="flex-1 text-center">
									Habla ahora por WhatsApp
								</span>
							</a>
						</form>
					</div>
				</div>
			</div>
		</section>
	);
};

export default Hero;