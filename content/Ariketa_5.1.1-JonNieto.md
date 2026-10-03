# **GIT Ariketa 5.1.1**

1. Crea la carpeta ***ariketa5.1.1-tuNombreApellido*** (ej: ariketa5.1.1-IgorGoikoetxea).
```bash
mkdir ariketa5.1.1-JonNieto
```
2. Convierte esa carpeta en repositorio.
```bash
git init
```
3. Dentro crea un ***README.md*** con el siguiente texto:
```
# Información

Primeros pasos con GIT
```
4. ¿Con qué comando se pueden ver los cambios? ¿Con qué color se muestran los cambios?  
```bash
git status
```
   **Rojo**  
   ![][image1]
5. Pasa el README.md a *stage.* ¿Con qué comando se puede ver el estado del fichero? ¿Con qué color aparece el fichero?  
```bash
git add .
```
```bash
git status
```
   **Berde**  
   ![][image2]  
6. Borra el fichero README.md.  
```bash
git rm README.md
```
7. ¿Con qué comando recuperarías el fichero [README.md](http://README.md)?  
```bash
git restore README.md
```
8. Crea un primer commit con el siguiente mensaje: “README creado”.  
```bash
git commit -m "README creado"
```
9. ¿Con qué comando se puede visualizar la información de ese commit? Explica la información que aparece en la pantalla.  
```bash
git log --oneline
```
10. Crea un ***index.html***, pásalo *stage* y crea un segundo commit con el siguiente texto: “añadido un index.html”  
```bash
touch index.html
```
```bash
git add .
```
```bash
git commit -m "añadido un index.html"
``` 
![][image3]

11. Dentro del repositorio crea una nueva carpeta llamada ***logs***. Dentro de esta carpeta crea los ficheros: ***hoy.log*** y ***historia.log***. 
```bash
mkdir logs
```
```bash
touch hoy.log historia.log
```
12. ¿Cómo se puede hacer para que GIT no tenga en cuenta los ficheros .log?
```bash
echo "*.log" > .gitignore
```
13. Comprueba que efectivamente GIT no tiene en cuenta los cambios realizados sobre  esos ficheros. Por ejemplo, haz un cambio sobre uno de los dos ficheros .log y ejecuta un git status.
![][image4]
14. Borra de manera segura el fichero index.html y haz un commit con este cambio con su correspondiente mensaje.
![][image5]
15. ¿Mediante qué comando/s se puede recuperar este fichero? Recuperálo y haz commit con el cambio.
![][image6]
![][image7]
![][image8]

[image1]: ../assets/img/ariketa-5-1-1-jon-nieto/image1.png

[image2]: ../assets/img/ariketa-5-1-1-jon-nieto/image2.png

[image3]: ../assets/img/ariketa-5-1-1-jon-nieto/image3.png

[image4]: ../assets/img/ariketa-5-1-1-jon-nieto/image4.png

[image5]: ../assets/img/ariketa-5-1-1-jon-nieto/image5.png

[image6]: ../assets/img/ariketa-5-1-1-jon-nieto/image6.png

[image7]: ../assets/img/ariketa-5-1-1-jon-nieto/image7.png

[image8]: ../assets/img/ariketa-5-1-1-jon-nieto/image8.png