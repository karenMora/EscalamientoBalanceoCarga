/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
*/package edu.eci.arsw.collabpaint;

import edu.eci.arsw.collabpaint.model.Point;
import java.util.ArrayList;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;;

/*
import edu.eci.arsw.collabpaint.model.Point;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.stereotype.Controller;
*/
/**
 *
 * @author karen mora
 */

@Controller
public class controlador {

    @Autowired
    SimpMessagingTemplate msgt;
    ConcurrentHashMap<String, ArrayList<Point>> repositorioPuntos = new ConcurrentHashMap<String, ArrayList<Point>>();

    @MessageMapping("/newpoint.{numdibujo}")
    public void handlePointEvent(Point pt, @DestinationVariable String numdibujo) throws Exception {
        System.out.println("Nuevo punto recibido en el servidor!:" + pt);
        msgt.convertAndSend("/topic/newpoint." +numdibujo, pt);
        ArrayList<Point> puntos = repositorioPuntos.get(numdibujo);
            if(puntos==null){
                puntos = new ArrayList<>();
                puntos.add(pt);
                repositorioPuntos.put(numdibujo, puntos);
            }
            else{
                puntos.add(pt);
                repositorioPuntos.replace(numdibujo, puntos);
            }

            if(puntos.size()==4){
                msgt.convertAndSend("/topic/newpolygon."+numdibujo, puntos);
                puntos.clear();
            }
    }

    }
/*  
    @MessageMapping("/hello")
    @SendTo("/topic/newpoint")
    public String mensajePoint(Point mensaje) throws InterruptedException{
        Thread.sleep(1000);
        return mensaje.toString();
    }
    */