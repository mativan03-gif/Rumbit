import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/privacidad")({
  head: () => ({
    meta: [
      { title: "Política de privacidad · Rumbit" },
      {
        name: "description",
        content: "Cómo Rumbit trata tus datos y cómo podés ejercer tus derechos.",
      },
    ],
  }),
  component: Privacidad,
});

function Privacidad() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <Link to="/" className="text-sm font-medium text-primary underline">
        Volver a Rumbit
      </Link>

      <h1 className="mb-4 mt-6 text-3xl font-bold">
        Política de privacidad de Rumbit
      </h1>
      <p>
        Rumbit es una aplicación de finanzas personales desarrollada como
        proyecto universitario. Te permite registrar ingresos, gastos y metas
        de ahorro. Los datos se cargan manualmente. Rumbit no se conecta a
        cuentas bancarias ni transfiere dinero.
      </p>

      <div className="mt-8 space-y-6">
        <section>
          <h2 className="mb-2 text-xl font-semibold">Quién es responsable</h2>
          <p>
            Matías Iván Martínez es el responsable del tratamiento de los datos.
            Domicilio: [COMPLETAR ANTES DE PUBLICAR]. Soporte Rumbit atiende las
            consultas de privacidad en{" "}
            <a className="underline" href="mailto:soporte-rumbit@googlegroups.com">
              soporte-rumbit@googlegroups.com
            </a>
            .
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-xl font-semibold">Qué datos usamos y para qué</h2>
          <p>
            Para acceder con una cuenta, usamos tu correo electrónico y el
            identificador de usuario asignado por Supabase. Si elegís Continuar
            con Google, Google y Supabase gestionan el inicio de sesión. Rumbit
            usa el correo disponible en la sesión y el identificador de Supabase
            para darte acceso y asociar los registros con tu cuenta.
          </p>
          <p className="mt-2">
            Podés cargar movimientos, categorías y metas de forma opcional.
            Usamos esa información y tus preferencias de perfil y moneda para
            mostrar tu historial, calcular tus estadísticas y seguir tus metas.
            También podés usar el modo invitado sin crear una cuenta.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-xl font-semibold">Dónde se guardan los datos</h2>
          <p>
            Vercel aloja la aplicación. Supabase gestiona la autenticación y
            almacena los datos de las cuentas. En el modo invitado, los datos
            de la demo se guardan en el navegador que usás. Podés quitarlos
            borrando los datos del sitio desde la configuración del navegador.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-xl font-semibold">Conservación y tus derechos</h2>
          <p>
            Conservamos tus movimientos y metas mientras tu cuenta siga activa
            o hasta que solicites su eliminación. Para solicitar acceso,
            rectificación, actualización o supresión de tus datos, o la baja de
            tu cuenta, escribí a{" "}
            <a className="underline" href="mailto:soporte-rumbit@googlegroups.com">
              Soporte Rumbit
            </a>{" "}
            desde el correo asociado a tu cuenta, si todavía tenés acceso a él.
          </p>
        </section>
      </div>
    </main>
  );
}
