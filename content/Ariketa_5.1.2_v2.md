# **GIT Ariketa 5.1.2**

1. Crea la carpeta ariketa5.1.2-tuNombreApellido (ej: ariketa5.1.2-IgorGoikoetxea) y conviértela en un repositorio de Git.
```bash
git init
```
2. Crea dos ficheros: servidor.txt y seguridad.txt. Escribe "Servidor activo" y "Reglas de firewall" respectivamente dentro de cada uno.
```bash
echo "Servidor activo" > servidor.txt
```
```bash
echo "Reglas de firewall" > seguridad.txt
```
3. Haz un commit con el mensaje: "Estado inicial del sistema".
```bash
git add .
```
```bash
git commit -m "Estado inicial del sistema"
```
4. Crea dos ramas sin cambiarte a ellas todavía: desarrollo y hotfix.

![][image1]

5. Salta a la rama desarrollo, crea un nuevo fichero llamado mfa.txt, escribe dentro "Autenticacion de doble factor" y haz un commit con el mensaje: "Añadido modulo MFA".

![][image2]

6. Desde la rama desarrollo, crea y salta en un solo comando a una tercera rama llamada experimental.

![][image3]

7. Modifica el archivo servidor.txt añadiendo al final la frase " \- Modo Pruebas" y haz un commit con el mensaje: "Servidor en modo pruebas".

![][image4]

8. Salta de nuevo a la rama desarrollo y abre el archivo servidor.txt. ¿Aparece la frase " \- Modo Pruebas"? ¿Por qué?

No porque los cambios están hechos en la otra rama, y no se ha hecho un merge para unificar esos cambios.

![][image5]

9. Desde la rama desarrollo, haz un merge con la rama experimental.

![][image6]

10. Borra la rama experimental y comprueba con un comando de listado que se ha eliminado correctamente.

![][image7]

11. Salta a la rama hotfix. Modifica la línea de servidor.txt para que ponga: "Servidor en mantenimiento urgente" y haz commit con el mensaje: "Parche urgente en servidor".

![][image8]

12. Salta a la rama main (o master). Modifica la misma línea de servidor.txt para que ponga: "Servidor actualizado v2.0" y haz commit con el mensaje: "Actualizacion v2.0".

![][image9]

13. Desde la rama main, intenta hacer un merge con la rama hotfix. ¿Qué ha pasado en la consola?

Ha surgido un conflicto al tener dos versiones diferentes del mismo archivo.

![][image10]

14. Abre el archivo servidor.txt. ¿Qué símbolos raros ha añadido Git y qué significa cada bloque?

![][image11]

15. Resuelve el conflicto editando el archivo para que la línea final sea: "Servidor en mantenimiento v2.0".

![][image12]

16. Intenta hacer git commit directamente sin ejecutar git add. ¿Qué te advierte Git?

Advierte que todavía tenemos cambios en working directory.

![][image13]

17. Ejecuta los comandos necesarios para marcar el conflicto como resuelto y completar el commit de merge.

![][image14]

18. Muestra el historial gráfico de commits en una sola línea para comprobar cómo ha quedado el árbol del repositorio.

![][image15]

**Extra**

1. Estando en la rama desarrollo, empieza a escribir una línea en seguridad.txt pero no hagas commit.
```bash
echo "Cambios ..." >> servidor.txt
```
2. Simula una emergencia: intenta saltar a main. Git te bloqueará por tener cambios pendientes. ¿O no?

Te pide que guardes los cambios antes de cambiar de rama.

![][image16]

3. Ejecuta git stash para pausar el trabajo, salta a main para verificar algo rápido y vuelve a desarrollo.

![][image17]

![][image18]

4. Recupera tu trabajo con git stash pop.

![][image19]

![][image20]

5. Comete un error intencionado en un commit (por ejemplo meter una clave o alguo similar en texto plano en un fichero para probat algo rápido) y deshazlo usando git revert HEAD para observar cómo queda registrado el despiste en git log.

![][image21]

6. Explica con tus propias palabras para que han servido:

   * **git stash**

   *Guarda los cambios no commiteado, para limpiar el working directory y el staged area.

   * **git stash pop**

   *Recupera el último cambio guardado en stash.

   * **git revert HEAD**

   *Revierte el último commit, y hace un nuevo commit sin los cambios del último commit.

[image1]: ../assets/img/ariketa-5-1-2-v2/image1.png

[image2]: ../assets/img/ariketa-5-1-2-v2/image2.png

[image3]: ../assets/img/ariketa-5-1-2-v2/image3.png

[image4]: ../assets/img/ariketa-5-1-2-v2/image4.png

[image5]: ../assets/img/ariketa-5-1-2-v2/image5.png

[image6]: ../assets/img/ariketa-5-1-2-v2/image6.png

[image7]: ../assets/img/ariketa-5-1-2-v2/image7.png

[image8]: ../assets/img/ariketa-5-1-2-v2/image8.png

[image9]: ../assets/img/ariketa-5-1-2-v2/image9.png

[image10]: ../assets/img/ariketa-5-1-2-v2/image10.png

[image11]: ../assets/img/ariketa-5-1-2-v2/image11.png

[image12]: ../assets/img/ariketa-5-1-2-v2/image12.png

[image13]: ../assets/img/ariketa-5-1-2-v2/image13.png

[image14]: ../assets/img/ariketa-5-1-2-v2/image14.png

[image15]: ../assets/img/ariketa-5-1-2-v2/image15.png

[image16]: ../assets/img/ariketa-5-1-2-v2/image16.png

[image17]: ../assets/img/ariketa-5-1-2-v2/image17.png

[image18]: ../assets/img/ariketa-5-1-2-v2/image18.png

[image19]: ../assets/img/ariketa-5-1-2-v2/image19.png

[image20]: ../assets/img/ariketa-5-1-2-v2/image20.png

[image21]: ../assets/img/ariketa-5-1-2-v2/image21.png