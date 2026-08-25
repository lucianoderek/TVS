// =====================================================
// CrackVision
// Sistema offline de análisis estructural
// Control principal
// =====================================================


// -----------------------------
// REFERENCIAS HTML
// -----------------------------

console.log("APP JS CARGADO");

const imageInput = document.getElementById("imageInput");
const uploadButton = document.getElementById("uploadButton");
const dropZone = document.getElementById("dropZone");


const preview = document.getElementById("preview");
const canvasOutput = document.getElementById("canvasOutput");


const indicator = document.getElementById("indicator");
const progressCircle = document.getElementById("progressCircle");
const damagePercent = document.getElementById("damagePercent");
const damageLabel = document.getElementById("damageLabel");


const statusText = document.getElementById("statusText");
const logBox = document.getElementById("log");



const crackCount = document.getElementById("crackCount");
const crackLength = document.getElementById("crackLength");
const affectedArea = document.getElementById("affectedArea");
const severity = document.getElementById("severity");


const sensitivity =
    document.getElementById(
        "sensitivity"
    );


const sensitivityValue =
    document.getElementById(
        "sensitivityValue"
    );


const areaLimit =
    document.getElementById(
        "areaLimit"
    );


const areaValue =
    document.getElementById(
        "areaValue"
    );

let detectorConfig = {

    sensitivity: 5,

    minArea: 15

};

sensitivity.addEventListener(
    "input",
    () => {

        detectorConfig.sensitivity =
            Number(
                sensitivity.value
            );


        sensitivityValue.textContent =
            sensitivity.value;



        if (lastAnalysisReady) {

            analyzeImage();

        }


    }
);



areaLimit.addEventListener(
    "input",
    () => {


        detectorConfig.minArea =
            Number(
                areaLimit.value
            );


        areaValue.textContent =
            areaLimit.value;



        if (lastAnalysisReady) {

            analyzeImage();

        }


    }
);



areaLimit.addEventListener(
    "input",
    () => {


        detectorConfig.minArea =
            Number(
                areaLimit.value
            );


        areaValue.textContent =
            areaLimit.value;



    }
);


// -----------------------------
// VARIABLES
// -----------------------------


let cvReady = false;

let currentImage = null;

let lastAnalysisReady = false;

let imageLoaded = false;





// -----------------------------
// ESPERAR OPENCV
// -----------------------------


function waitForOpenCV(){


    if(typeof cv !== "undefined"){


        cv.onRuntimeInitialized = () => {


            cvReady = true;


            addLog(
                "OpenCV cargado correctamente."
            );


            setStatus(
                "Sistema listo."
            );


        };


    }

    else {


        setTimeout(
            waitForOpenCV,
            500
        );


    }


}


waitForOpenCV();







// -----------------------------
// UTILIDADES UI
// -----------------------------



function setStatus(message){


    statusText.textContent = message;


}





function addLog(message){


    const time =
        new Date()
        .toLocaleTimeString();



    logBox.innerHTML +=
        `<br>[${time}] ${message}`;


}





// -----------------------------
// BOTON CARGAR
// -----------------------------


uploadButton.addEventListener(
    "click",
    ()=>{


        imageInput.click();


    }
);






// -----------------------------
// SELECCION ARCHIVO
// -----------------------------


imageInput.addEventListener(
    "change",
    event=>{


        const file =
            event.target.files[0];



        if(file){

            loadImage(file);

        }


    }
);






// -----------------------------
// DRAG & DROP
// -----------------------------



dropZone.addEventListener(
    "dragover",
    event=>{


        event.preventDefault();


        dropZone.classList.add(
            "drag-active"
        );


    }
);




dropZone.addEventListener(
    "dragleave",
    ()=>{


        dropZone.classList.remove(
            "drag-active"
        );


    }
);




dropZone.addEventListener(
    "drop",
    event=>{


        event.preventDefault();


        dropZone.classList.remove(
            "drag-active"
        );



        const file =
            event.dataTransfer.files[0];



        if(file &&
           file.type.startsWith("image")){


            loadImage(file);


        }


    }
);





// -----------------------------
// CARGAR IMAGEN
// -----------------------------


function loadImage(file){


    const reader =
        new FileReader();



    reader.onload = e=>{


        preview.src =
            e.target.result;



        currentImage =
            e.target.result;



        imageLoaded = true;

        lastAnalysisReady = true;



        indicator.classList.remove(
            "hidden"
        );



        setStatus(
            "Imagen cargada. Preparando análisis..."
        );



        addLog(
            "Imagen recibida: " + file.name
        );


    };



    reader.readAsDataURL(file);


}






// -----------------------------
// IMAGEN LISTA
// -----------------------------


preview.onload = ()=>{


    if(!cvReady){


        addLog(
            "Esperando OpenCV..."
        );


        return;

    }



    if(imageLoaded){


        analyzeImage();


    }


};

// =====================================================
// PROCESAMIENTO PRINCIPAL
// =====================================================


function analyzeImage(){


    if(!cvReady || !imageLoaded){

        return;

    }



    setStatus(
        "Procesando imagen..."
    );


    addLog(
        "Iniciando análisis estructural."
    );



    try{


        // -----------------------------
        // CARGAR IMAGEN EN OPENCV
        // -----------------------------


        let src =
            cv.imread(preview);



        let gray =
            new cv.Mat();



        let enhanced =
            new cv.Mat();



        let filtered =
            new cv.Mat();



        let blackhat =
            new cv.Mat();



        let binary =
            new cv.Mat();





        // -----------------------------
        // ESCALA DE GRISES
        // -----------------------------


        cv.cvtColor(
            src,
            gray,
            cv.COLOR_RGBA2GRAY
        );



        addLog(
            "Conversión escala de grises."
        );





        // -----------------------------
        // MEJORA CONTRASTE CLAHE
        // -----------------------------


        let clahe =
            new cv.CLAHE(
                3.0,
                new cv.Size(8,8)
            );



        clahe.apply(
            gray,
            enhanced
        );



        clahe.delete();



        addLog(
            "Contraste mejorado."
        );







        // -----------------------------
        // FILTRO BILATERAL
        // CONSERVA BORDES FINOS
        // -----------------------------


        cv.bilateralFilter(
            enhanced,
            filtered,
            9,
            75,
            75
        );



        addLog(
            "Filtro de ruido aplicado."
        );






        // -----------------------------
        // BLACK HAT
        // DETECTA ELEMENTOS OSCUROS
        // -----------------------------


        let kernel =
            cv.getStructuringElement(
                cv.MORPH_ELLIPSE,
                new cv.Size(31, 31)
            );



        cv.morphologyEx(
            filtered,
            blackhat,
            cv.MORPH_BLACKHAT,
            kernel
        );



        kernel.delete();



        addLog(
            "Extracción de estructuras oscuras."
        );







        // -----------------------------
        // THRESHOLD ADAPTATIVO
        // -----------------------------


        cv.threshold(
            blackhat,
            binary,
            0,
            255,
            cv.THRESH_BINARY +
            cv.THRESH_OTSU
        );



        addLog(
            "Segmentación inicial."
        );







        // -----------------------------
        // LIMPIEZA MORFOLOGICA
        // -----------------------------


        let clean =
            new cv.Mat();



        let morphKernel =
            cv.getStructuringElement(
                cv.MORPH_RECT,
                new cv.Size(3,3)
            );



        cv.morphologyEx(
            binary,
            clean,
            cv.MORPH_OPEN,
            morphKernel
        );



        cv.morphologyEx(
            clean,
            binary,
            cv.MORPH_CLOSE,
            morphKernel
        );



        morphKernel.delete();



        clean.delete();



        addLog(
            "Ruido eliminado."
        );




        // enviar al análisis final

        analyzeContours(
            src,
            binary
        );





        // liberar memoria


        gray.delete();

        enhanced.delete();

        filtered.delete();

        blackhat.delete();

        binary.delete();

        src.delete();



    }


    catch(error){


        console.error(error);


        addLog(
            "Error: " + error.message
        );


        setStatus(
            "Error durante análisis."
        );


    }


}

// =====================================================
// ANALISIS DE CONTORNOS
// =====================================================


function analyzeContours(src, binary){



    addLog(
        "Analizando estructuras detectadas."
    );



    let contours =
        new cv.MatVector();



    let hierarchy =
        new cv.Mat();



    cv.findContours(
        binary,
        contours,
        hierarchy,
        cv.RETR_EXTERNAL,
        cv.CHAIN_APPROX_SIMPLE
    );



    let output =
        src.clone();




    let detectedCracks = 0;

    let totalLength = 0;

    let affectedPixels = 0;





    // recorrer objetos encontrados


    for(
        let i = 0;
        i < contours.size();
        i++
    ){



        let contour =
            contours.get(i);




        let area =
            cv.contourArea(
                contour
            );



        let rect =
            cv.boundingRect(
                contour
            );



        let width =
            rect.width;



        let height =
            rect.height;




        let length =
            Math.max(
                width,
                height
            );



        let thickness =
            Math.min(
                width,
                height
            );



        let ratio =
            length /
            Math.max(
                thickness,
                1
            );






        /*
            FILTRO DE GRIETA

            Una grieta suele ser:
            - larga
            - delgada
            - continua

        */



        let isCrack =
            false;



        if(
            area > detectorConfig.minArea &&
            length > 20 &&
            ratio > (3 - detectorConfig.sensitivity * 0.15)
        ){

            isCrack = true;

        }





        if(isCrack){


            detectedCracks++;



            totalLength += length;



            affectedPixels += area;




            // dibujar contorno rojo


            let color =
                new cv.Scalar(
                    255,
                    0,
                    0,
                    255
                );



            cv.drawContours(
                output,
                contours,
                i,
                color,
                2
            );



        }



        contour.delete();


    }







    // mostrar resultado


    cv.imshow(
        canvasOutput,
        output
    );




    calculateResults(
        detectedCracks,
        totalLength,
        affectedPixels,
        src.rows * src.cols
    );



    output.delete();

    contours.delete();

    hierarchy.delete();





}









// =====================================================
// RESULTADOS
// =====================================================


function calculateResults(
    count,
    length,
    pixels,
    totalPixels
){



    let areaPercent =
        (
            pixels /
            totalPixels
        ) * 100;



    let damage =
        areaPercent * 15;



    if(damage > 100){

        damage = 100;

    }






    crackCount.textContent =
        count;



    crackLength.textContent =
        Math.round(length)
        + " px";



    affectedArea.textContent =
        areaPercent
        .toFixed(2)
        + "%";






    updateIndicator(
        damage
    );






    if (damage < 20) {


        severity.textContent =
            "Bajo";


        severity.className =
            "damage-low";


    }
    else if (damage < 35) {


        severity.textContent =
            "Moderado";


        severity.className =
            "damage-medium";


    }
    else {


        severity.textContent =
            "Alto";


        severity.className =
            "damage-high";


    }






    setStatus(
        "Análisis completado."
    );


    addLog(
        "Proceso finalizado."
    );



}

// =====================================================
// INDICADOR DE DAÑO
// =====================================================


function updateIndicator(value){



    value =
        Math.max(
            0,
            Math.min(
                100,
                value
            )
        );



    let circumference =
        2 *
        Math.PI *
        60;




    let offset =
        circumference *
        (
            1 -
            value / 100
        );




    progressCircle.style.strokeDasharray =
        circumference;



    progressCircle.style.strokeDashoffset =
        offset;





    animateNumber(
        damagePercent,
        value
    );




    if (value < 15) {


        damageLabel.textContent =
            "Daño bajo";


    }
    else if (value < 50) {


        damageLabel.textContent =
            "Daño moderado";


    }
    else {


        damageLabel.textContent =
            "Daño alto";


    }



}







// =====================================================
// ANIMACION NUMERO
// =====================================================


function animateNumber(
    element,
    target
){



    let current = 0;



    let interval =
        setInterval(
            ()=>{


                current += 1;



                element.textContent =
                    Math.round(current)
                    + "%";



                if(
                    current >= target
                ){

                    clearInterval(
                        interval
                    );

                }



            },
            15
        );



}








// =====================================================
// UTILIDAD: ESPERA
// =====================================================


function sleep(ms){


    return new Promise(
        resolve =>
            setTimeout(
                resolve,
                ms
            )
    );


}








// =====================================================
// LIMPIEZA AL CAMBIAR IMAGEN
// =====================================================


function resetResults(){



    crackCount.textContent =
        "0";



    crackLength.textContent =
        "0 px";



    affectedArea.textContent =
        "0%";



    severity.textContent =
        "N/A";



    damagePercent.textContent =
        "0%";



}








// =====================================================
// CONTROL DE ERRORES GLOBAL
// =====================================================


window.addEventListener(
    "error",
    event=>{


        addLog(
            "Error del sistema: "
            +
            event.message
        );


    }
);







addLog(
    "Sistema iniciado."
);

// =====================================================
// FILTRO AVANZADO DE CONTINUIDAD DE GRIETAS
// =====================================================


function evaluateCrackShape(contour) {


    const rect =
        cv.boundingRect(contour);



    const width =
        rect.width;


    const height =
        rect.height;



    const area =
        cv.contourArea(contour);



    const perimeter =
        cv.arcLength(
            contour,
            true
        );



    if (perimeter === 0)
        return false;



    const compactness =
        (
            4 *
            Math.PI *
            area
        )
        /
        (
            perimeter *
            perimeter
        );



    const length =
        Math.max(
            width,
            height
        );



    const thickness =
        Math.min(
            width,
            height
        );



    const ratio =
        length /
        Math.max(
            thickness,
            1
        );



    /*
        Una grieta suele ser:

        - larga
        - poco compacta
        - estrecha

    */


    return (
        ratio > (8 - detectorConfig.sensitivity / 2) &&
        compactness < 0.55 &&
        area > 15
    );

}
