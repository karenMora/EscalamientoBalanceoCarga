# EscalamientoBalanceoCarga

# PARTE 0 ENTORNO VIRTUAL
1. Importe la máquina virtual suministrada (extensión .ova).

![](img/Parte0p1.PNG)

2. Antes de iniciar la máquina virtual, configure las redes de VirtualBox (File/Preferences/Network). Si no está configurada, agregue una red NAT (NatNework) y otra red Host-only Network (vboxnet0)
![](img/network.PNG)

![](img/Parte0p1.PNG)

3. Configure la máquina virtual (Settings/Network) y configure dos adaptadores de red. El primero de tipo 'Host-only' (asociado a la red vboxnet0), y el segundo de tipo NAT-Network (asociado a la red (NatNetwork).
![](img/adapter.PNG)

![](img/Parte0p3.PNG)

4. Inicie la máquina virtual y autentíquese con ubuntu / reverse .

![](img/Parte0p4.1.PNG)
![](img/Parte0p4.2.PNG)

5. Configure la máquina virtual para que active el segundo adaptador de red. Para eso, en la máquina virtual edite el archivo /etc/network/interfaces y agregue: "auto eth1" y "iface eth1 inet dhcp "

![](img/Parte0p5.PNG)

6. Reinicie la máquina y verifique que la máquina tenga salida a Internet. Para esto, haga PING a un servidor desde la máquina virtual.

![](img/Parte0p6.0.PNG)
![](img/Parte0p6.1.PNG)

7. Verifique que la máquina virtual sea accesible desde la máquina real. Revise la dirección IP (la que empieza con 192.168.56.) de la máquina virtual (comando ifconfig), e intente hacer ping desde la máquina real a dicha dirección.

![](img/Parte0p7.PNG)

8. Apague la máquina virtual (sudo shutdown -P 0), y ahora cree un clon de la misma (clic-derecho sobre la máquina virtual / Clone). No olvide elegir la opción de reiniciar la dirección MAC de los adaptadores de red, y haga un clonado de tipo 'Linked Clone'. Una vez clonado, rectifique que los adaptadores de red de la nueva máquina virtual tiene direcciones MAC diferentes a la máquina original.

![](img/Parte0p8.0.PNG)
![](img/Parte0p8.1.PNG)
![](img/Parte0p8.2.PNG)
![](img/Parte0p8.3.PNG)
![](img/Parte0p8.4.PNG)
![](img/Parte0p8.5.PNG)

9. Inicie ambas máquinas y verifique que queden con sus respectivas direcciones, y que éstas sean accesibles. Una vez verificado esto, puede conectarse a las máquinas virtuales a través de ssh (para no tener que usar la terminal de la máquina virtual): "ssh ubuntu@192.168.56.XX"

![](img/Parte0p9.0.PNG)
![](img/Parte0p9.1.PNG)


# parte 1

1. En uno de los dos servidores virtuales, inicie el servidor ActiveMQ. Para esto, ubíquese en el directorio apache-activemq-5.14.1/bin (en el directorio raíz del usuario 'ubuntu'), y ejecute ./activemq start .

![](img/parte1P1.0.PNG)
![](img/parte1P1.1.PNG)

2. Para verificar que el servidor de mensajes esté arriba, abra la consola de administración de ActiveMQ: http://IP_SERVIDOR:8161/admin/ (usuario/contraseña: admin/admin) . Consulte qué tópicos han sido creados en el momento.

![](img/parte1P2.1.PNG)
![](img/parte1P2.2.PNG)

3. Recupere la última versión del ejericio realizado de WebSockets (creación colaborativa de polígonos). Modifíquelo para que en lugar de usar el 'simpleBroker' (un broker de mensajes embebido en la aplicación), delegue el manejo de los eventos a un servidor de mensajería dedicado (en este caso, ActiveMQ).
Es decir, en la configuración en lugar de: "config.enableSimpleBroker("/topic");" 
Se configurará como: "config.enableStompBrokerRelay("/topic/").setRelayHost("127.0.0.1").setRelayPort(61613);"

![](img/)

4. Teniendo en cuenta que el parámetro 'relayHost' deberá tener la IP del host donde esté funcionando el servidor de mensajería.

![](img/)

5. Modifique, también en la configuración, el registro del 'endpoint', para que permita mensajes de otros servidores (por defecto sólo acepta de sí mismo). Eso es requerido para permitir el manejo del balanceador de carga:

![](img/override5.png)

Agregue las siguientes dependencias al proyecto:

![](img/dependency5.png)


6. Copie la aplicación a los dos servidores virtuales (puede usar ssh, o publicarla en un repositorio GIT y luego clonarla desde cada máquina).

![](img/)

7. En cada máquina ejecute la aplicación, y desde el navegador (en la máquina real) verifique que las dos aplicaciones funcionen correctamente (usando las respectivas direcciones IP).

![](img/)

8. Al haber usado la aplicación, consulte nuevamente la consola Web de ActiveMQ, y revise qué información de tópicos se ha mostrado.

![](img/)

# Parte 2

Escoja uno de sus dos servidores como responsable del balanceo de carga. En el que corresponda, cree un archivo de configuración para NGINX

1. Cree un archivo de configuración NGINX (por convención, use la extensión .conf), compatible con WebSockets, a partir de la siguiente plantilla. Ajuste la configuración de 'upstream' para que use el host y el puerto de los dos servidores virtuales, y el parámero 'listen' para que escuche en el puerto 8090 (o cualquier otro, siempre que sea diferente al usado por la aplicación que está en el mismo servidor).


events {
    worker_connections 768;
    # multi_accept on;
}
 
http {
 
    log_format formatWithUpstreamLogging '[$time_local] $remote_addr - $remote_user - $server_name to: $upstream_addr: $request';
 
    access_log   access.log formatWithUpstreamLogging;
    error_log    error.log;

    map $http_upgrade $connection_upgrade {
        default upgrade;
        '' close;
    } 

    upstream simpleserver_backend {
    # default is round robin
        server localhost:8081;
        server localhost:8082;
    }
 
    server {
        listen 8000;
 
        location / {
            proxy_pass http://simpleserver_backend;
	    	proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection $connection_upgrade;

        }
    }
}

Incie el servidor NGINX con: "nginx -c ruta-completa-archivo-configuración"

2. Desde un navegador, abra la URL de la aplicación, pero usando el puerto del balanceador de carga (8090). Verifique el funcionamiento de la aplicación.

![](img/)

3. Revise en la documentación de NGINX, cómo cambiar la estrategía por defecto del balanceador por la estrategia 'least_conn'.

![](img/)

4. Ejecute de nuevo la aplicación, pero esta vez abriendo la aplicación desde navegadores diferentes (p.e. Chrome y Firefox), y haciendo uso de la misma.

![](img/)

5. Revise, a través de los LOGs de cada servidor, si se están distribuyendo las peticiones. Revise qué instancia de la aplicación se le está asignando a cada cliente.

![](img/)

6. Apague una de las dos aplicaciones (Ctrl+C), y verifique qué pasa con el cliente que estaba trabajando con el servidor recién apagado.

![](img/)

7. Ajuste la aplicación para que la misma no tenga 'quemadas' datos como el host del servidor de mensajería o el puerto. Para esto revise la discusión hecha en StackOverflow al respecto.

![](img/)

8. Suba en moodle la nueva versión de la aplicación.\

# Parte 3

En su ejercicio, haga una rama llamada 'cloud-based-mom'. En ésta, configure su aplicación para que en lugar de usar el servidor JMeter, haga uso del servicio en RabbitMQ en la nube de CloudAMQP, el cual también es compatible con STOMP. Para esto:

1. Regístrese en la plataforma y cree una instancia gratuita (Lemur).

![](img/)

2. Abra la consola de configuración, y revise las credenciales de acceso.

![](img/)

3. Abra el siguiente ejemplo y revise cómo se configuró el 'relay-broker' para usar el servicio de mensajería de CloudAMQP.

![](img/)

4. Ejecute la aplicación y revise su funcionamiento. Acceda a la consola de administración de CloudAMQP y revise qué efectivamente se estén creando los tópicos correspondientes.

![](img/)

5. Consulte 'benchmarks' comparativos entre RabbitMQ y ActiveMQ, y analice cual sería más conveniente.

![](img/)

# Parte 4(Para el martes en clase impreso)

1. Haga el diagrama de despliegue (incluyendo el detalle de los componentes de cada servidor) para la versión original del laboratorio.

![](img/)

2. Haga el diagrama de despliegue (incluyendo el detalle de componentes) para la nueva versión del laboratrio. En este caso suponga que los servidores no están en máquinas virtuales sino en máquinas reales.

![](img/)

3. Analice e indique, con la nueva arquitectura planteada qué problemas o inconsistencias se podrían presentar con la aplicación?. Qué solución plantearía al respecto?

![](img/)




//----------------------------------created by Karen Mora----------------------------------//
