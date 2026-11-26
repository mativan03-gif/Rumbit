export function PrivacyPolicy() {
  return (
    <div className="mt-8 space-y-6">
      <section>
        <h2 className="mb-2 text-xl font-semibold">Sobre Rumbit</h2>
        <p>
          Rumbit es una aplicación de finanzas personales desarrollada por el Equipo Rumbit como
          proyecto académico de la materia Negocios Digitales de la Universidad Abierta
          Interamericana (UAI). El proyecto se realizó en la sede Humberto Primo, ubicada en
          Humberto 1.º 958, Ciudad Autónoma de Buenos Aires.
        </p>
        <p className="mt-2">
          Podés registrar ingresos, gastos y metas de ahorro. Los datos se cargan manualmente.
          Rumbit no se conecta a tus cuentas bancarias ni realiza operaciones financieras.
        </p>
      </section>

      <section>
        <h2 className="mb-2 text-xl font-semibold">Quién es responsable de tus datos</h2>
        <p>
          El responsable del tratamiento de datos es Matías Martínez, con domicilio en México 3351,
          Ciudad Autónoma de Buenos Aires.
        </p>
      </section>

      <section>
        <h2 className="mb-2 text-xl font-semibold">Si usás Rumbit como invitado</h2>
        <p>
          Podés probar la aplicación sin crear una cuenta. Los cambios que hagas en la demo se
          guardan en el navegador que usaste y siguen disponibles después de salir. Para quitarlos,
          podés borrar los datos del sitio desde la configuración de tu navegador. El progreso del
          minijuego de Rumi también se guarda en el navegador.
        </p>
      </section>

      <section>
        <h2 className="mb-2 text-xl font-semibold">Si usás Rumbit con una cuenta</h2>
        <p>
          Usamos tu correo electrónico y un identificador de usuario para darte acceso y asociar tus
          registros con tu cuenta. Supabase gestiona la autenticación. Si elegís «Continuar con
          Google», Google y Supabase intervienen en el inicio de sesión.
        </p>
        <p className="mt-2">
          Los datos que decidas cargar, como movimientos, metas, presupuestos, pagos previstos y
          preferencias, se guardan en Supabase. Los usamos para mostrarte tu historial, calcular
          estadísticas y ayudarte a seguir tus metas. Tu navegador guarda la información necesaria
          para mantener la sesión. Vercel aloja la aplicación.
        </p>
        <p className="mt-2">
          Cuando aceptás los términos y condiciones, guardamos en tu cuenta la versión que aceptaste
          y la fecha de aceptación.
        </p>
      </section>

      <section>
        <h2 className="mb-2 text-xl font-semibold">Cómo borrar registros o cerrar sesión</h2>
        <p>
          Podés eliminar movimientos y metas desde sus respectivas secciones. Si usás una cuenta,
          esos cambios se guardan en Supabase. Al cerrar sesión, se termina el acceso desde ese
          navegador y los registros de tu cuenta siguen guardados.
        </p>
      </section>

      <section>
        <h2 className="mb-2 text-xl font-semibold">Conservación de datos y baja de cuenta</h2>
        <p>
          Conservamos los datos de tu cuenta mientras sean necesarios para prestar el servicio.
          Podés solicitar la baja por el correo de soporte indicado abajo. Si todavía tenés acceso
          al correo asociado a tu cuenta, enviá la solicitud desde esa dirección.
        </p>
        <p className="mt-2">
          Cuando se elimina tu cuenta, también se eliminan los registros asociados de la base de
          datos activa de Rumbit, salvo que exista una obligación legal de conservarlos.
        </p>
      </section>

      <section>
        <h2 className="mb-2 text-xl font-semibold">Cómo ejercer tus derechos</h2>
        <p>
          Podés solicitar acceso a tus datos, pedir que se corrijan o actualicen, o solicitar su
          eliminación cuando corresponda. Para hacerlo o hacer consultas de privacidad, escribinos a{" "}
          <a className="underline" href="mailto:soporte-rumbit@googlegroups.com">
            soporte-rumbit@googlegroups.com
          </a>
          .
        </p>
      </section>
    </div>
  );
}
