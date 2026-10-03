# **GIT Ariketa 5.1.3**

1. Crea en GitHub un repositorio privado llamado ***ariketa5.1.3-tuNombreApellido***.
   ![][image1]
2. Crea un ***README.md*** con un pequeña descripción.

   ![][image2]

3. Descárgalo en tu repositorio local.

   ![][image3]

4. Crea un documento llamado ***ziber\_localidades.txt*** con el siguiente contenido: Urnieta, Andoain, Irun, Beasain, Donostia y Pasaia. 
```bash
echo "Urnieta, Andoain, Irun, Beasain, Donostia y Pasaia." > ziber_localidades.txt
```
5. Haz commit con el mensaje correspondiente.

   ![][image4]

6. Añade al documento: Lasarte-Oria y Oiartzun.
```bash
echo "Lasarte-Oria y Oiartzun." >> ziber_localidades.txt
```
7. Comitea estos cambios con el mensaje correspondiente.

   ![][image5]

   

8. Sube los cambios a GitHub y comprueba que todo está correctamente.
```bash
git push origin main
```
   ![][image6]

9. Añade al fichero local: Lesaka.
```bash
echo "Lesaka." >> ziber_localidades.txt
```

10. Comitea estos cambios con el mensaje correspondiente.

    ![][image7]

11. Desde GitHub añade Ordizia y haz commit.

    ![][image8]

    

12. Intenta actualizar tu repositorio local y el de GitHub. ¿Qué ocurre? 

    ![][image9]

13. Resuelve el conflicto mediante los comandos necesarios para que tu repositorio local y el de GitHub estén actualizados/sincronizados correctamente.

    ![][image10]

    ![][image11]

    ![][image12]

    ![][image13]

14. En el documento ***ziber\_localidades.txt*** debe aparecer lo siguiente:

| Urnieta Andoain Irun Beasain Donostia Pasaia Lasarte-Oria Oiartzun Lesaka Ordizia |
| :---- |

# **EXTRA — TRABAJAR CON RAMAS**

A partir de ahora evitaremos que todos los cambios se realicen directamente sobre main.

Crea una nueva rama:

```bash
git switch -c feature/comarcas
git branch
```

![][image14]

Añade al fichero: Hondarribia, Errenteria, Hernani. Realiza un commit:

Publica la rama y accede a GitHub para comprobar que existe:

![][image15]

| Pregunta: ¿Qué diferencia hay entre main y feature/comarcas? |
| :---- |

**Son dos ramas diferentes, las cuales tienen diferentes historiales.**

Desde GitHub crea un Pull Request: feature/comarcas → main. La descripción debe explicar qué cambios has realizado, qué archivos has modificado y qué pruebas has realizado.

Antes de aceptar el Pull Request, revisa los cambios. Después realiza el merge.

![][image16]

![][image17]

![][image18]

Después del merge, vuelve a tu terminal:

El repositorio debe quedar sincronizado.

![][image19]

![][image20]

Simula un error añadiendo al archivo: LOCALIDAD\_INCORRECTA.
```bash
echo "LOCALIDAD_INCORRECTA" > ziber_localidades.txt
```
El cambio es incorrecto. Investiga y utiliza git revert para deshacer el commit:

| Pregunta: ¿Por qué git revert es preferible a borrar o modificar el historial cuando trabajamos sobre una rama compartida? |
| :---- |

![][image21]

![][image22]

Crea un archivo config.env con contenido sensible (usuario, token, contraseña) y comprueba git status.

| GITHUB\_USER=usuario API\_TOKEN=123456789 PASSWORD=SuperSecret123 |
| :---- |

![][image23]

Crea o modifica .gitignore para que incluya:

| .env \*.env \*.key \*.pem secrets/ |
| :---- |

![][image24]

Comprueba nuevamente git status.

| Pregunta: ¿Por qué un archivo ignorado no aparece en git status? |
| :---- |

![][image25]

Imagina el siguiente error:

```bash
git add config.env
git commit -m "Añade configuración"
git push
```

![][image26]

Posteriormente añades config.env al .gitignore.

| Pregunta: ¿Ha desaparecido el secreto del repositorio? Comprueba git log \--all \-- config.env e investiga qué debería hacer un equipo si una contraseña real hubiese sido publicada accidentalmente. |
| :---- |

**Habría que buscar el commit donde están las credenciales y borrarlo. Luego por recomendación se debería cambiar la contraseña.**

[image1]: ../assets/img/ariketa-5-1-3/image1.png

[image2]: ../assets/img/ariketa-5-1-3/image2.png

[image3]: ../assets/img/ariketa-5-1-3/image3.png

[image4]: ../assets/img/ariketa-5-1-3/image4.png

[image5]: ../assets/img/ariketa-5-1-3/image5.png

[image6]: ../assets/img/ariketa-5-1-3/image6.png

[image7]: ../assets/img/ariketa-5-1-3/image7.png

[image8]: ../assets/img/ariketa-5-1-3/image8.png

[image9]: ../assets/img/ariketa-5-1-3/image9.png

[image10]: ../assets/img/ariketa-5-1-3/image10.png

[image11]: ../assets/img/ariketa-5-1-3/image11.png

[image12]: ../assets/img/ariketa-5-1-3/image12.png

[image13]: ../assets/img/ariketa-5-1-3/image13.png

[image14]: ../assets/img/ariketa-5-1-3/image14.png

[image15]: ../assets/img/ariketa-5-1-3/image15.png

[image16]: ../assets/img/ariketa-5-1-3/image16.png

[image17]: ../assets/img/ariketa-5-1-3/image17.png

[image18]: ../assets/img/ariketa-5-1-3/image18.png

[image19]: ../assets/img/ariketa-5-1-3/image19.png

[image20]: ../assets/img/ariketa-5-1-3/image20.png

[image21]: ../assets/img/ariketa-5-1-3/image21.png

[image22]: ../assets/img/ariketa-5-1-3/image22.png

[image23]: ../assets/img/ariketa-5-1-3/image23.png

[image24]: ../assets/img/ariketa-5-1-3/image24.png

[image25]: ../assets/img/ariketa-5-1-3/image25.png

[image26]: ../assets/img/ariketa-5-1-3/image26.png