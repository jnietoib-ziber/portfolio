> En esta primera actividad voy a descargar el codigo de una web vulnerable llamada `Gestor de nostas` y desplegarla usando Docker. Para posteriormente analizarla.

## Instalación Docker
Para realizar la practica necesito tener Docker instalado en mi equipo. Para ello uso el siguiente comando:
```bash
sudo apt update && sudo apt install docker.io -y
```
## Descarga de imagen
Una vez que tengo docker, elijo la imagen sobre la que voy a basar mi contenedor y luego la descargo en mi equípo En este caso usare Ubuntu y la descargo usando el siguiente comando:
```bash
sudo docker pull ubuntu:latest
```
---
Para comprobar que se ha instalado uso el siguiente comando:
```bash
sudo docker images
```
## Creación del contenedor
Ya con la imagen lista para el contenedor, voy a crearlo con el puerto 8080 y un volumen para mantener la persistencia y los cambios del código.
```bash
sudo docker run -d --name vuln-web -p 8080:80 -v ~/GestorNotas/:/var/www/html ubuntu
```
---
Ahora puedo ver que el contenedor esta en ejecución mediante el siguiente comando:
```bash
sudo docker ps
```
## Configuración e instalación de servicios
Entro al contenedor usando este comando:
```bash
sudo docker exec -it vuln-web bash
```
---
Una vez en el contendor tengo que instalar apache2, php y mariadb. Para ello uso el siguiente comando:
```bash
sudo apt update && sudo apt install apache2 && sudo apt install mariadb && sudo apt php8.5
```
---
Ya con los servicios instalados pasamos a configurarlos. Primero configuro apache para se vea la web.
```
```
Y habilito el modulo de php, para que la web procese código php.
```bash
a2enmod php8.5
```
Por último reinicio para aplicar la configuración en apache.
```bash
service apache2 restart
```
---
Ahora configuro mariadb, para ello, primero hay que usar el siguiente comando para cambiar la contraseña de root.
```bash
service mariadb start
```
```bash
mysql_secure_installation
```
---
Me conecto a mariadb.
```bash
mysql -uroot -proot
```
Aquí dentro creo la base de datos con sus respectivas tablas y datos.
```sql
create database Practica_Vulnerabilidades1;
```
```sql
use Practica_Vulnerabilidades1
```
```sql
create table  users(
	id INT AUTO_INCREMENT PRIMARY KEY,
	username VARCHAR(50) NOT NULL,
	password VARCHAR(50) NOT NULL
);
```
```sql
create table  notes(
	id INT AUTO_INCREMENT PRIMARY KEY,
	user_id INT NOT NULL,
	title VARCHAR(100),
	content TEXT,
	FOREING KEY (user_id) REFERENCES users(id)
);
```
```sql
insert into users (username, password) values ('admin', 'admin123');
insert into users (username, password) values ('usuario1', 'clave123');
```
## Acceso web
Con los pasos previos ya esta la web vulnerable desplaga en el contenedor de Docker y accesible via web en la siguiente ruta:
```
http://localhost:8080
```
## Vulnerabilidades encontradas
### SQLi
El panel de login, es vulnerable a una injección sql, debido a que no se sanetizan los inputs. Con lo que un atacante puede bypasear el login.
```
' or 1=1 -- -
```
### XSS
En el apartado de notas se puede injectar código javascript, debido a que los campos titulo y comentario no estan sanetizados. Esto permite a un atacanta ejecutar código js en cualquier usuario que acceda a la página. Por ejemplo se podría mostrar la cookie de sesión.
```js
<script>alert(document.cookie);</script>
```
### IDOR
La web da la oportunidad de eliminar notas mediante una petición por GET. Pero no controla que la nota que se vaya a eliminar sea del usuario que esta eliminando. Permitiendo a un atacante hacer peticiones por GET y eliminar notas de otros usuarios.
```
http://localhost:8080/delete_note.php?id=X
```
### Mala configuración
En el archivo `config.php` se ve que la web usa el usuario por defecto de mariadb. Además tiene el usuario y contraseña hardcodeadas, en lugar de usar variable de entorno.
```php
$user = "root";
$pass = "";
```