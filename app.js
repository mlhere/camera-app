// Set constraints for the video stream
var constraints = { video: { facingMode:"environment"}, audio: false };
//var inference_url='https://ec2-50-18-222-52.us-west-1.compute.amazonaws.com:9013/inference'
var inference_url='https://www.mlhere.io/inference'
//var feedback_url = "https://wpro6i5u90.execute-api.us-west-1.amazonaws.com/api/put_object" //EC2 DEV
var feedback_url = "https://kzkcpifiv6.execute-api.us-west-1.amazonaws.com/api/put_object"; //mlhere.io
// Define constants
const cameraView = document.querySelector("#camera--view"),
    cameraOutput = document.querySelector("#camera--output"),
    cameraSensor = document.querySelector("#camera--sensor"),
    cameraTrigger = document.querySelector("#shoot"),
    submitTrigger = document.querySelector("#submit"),
    returnTrigger = document.querySelector("#return"),
    feedbackTrigger = document.querySelector("#feedback");

// Access the device camera and stream to cameraView
function cameraStart(){
    var DEVICES = [];
    var final = null;
    navigator.mediaDevices.enumerateDevices()
    .then(function(devices) {

        var arrayLength = devices.length;
        for (var i = 0; i < arrayLength; i++)
        {
            var tempDevice = devices[i];
            //FOR EACH DEVICE, PUSH TO DEVICES LIST THOSE OF KIND VIDEOINPUT (cameras)
            //AND IF THE CAMERA HAS THE RIGHT FACEMODE ASSING IT TO "final"
            if (tempDevice.kind == "videoinput")
            {
                DEVICES.push(tempDevice);
                if(tempDevice.facingMode == "environment" ||tempDevice.label.indexOf("facing back")>=0 )
                    {final = tempDevice;}
            }
        }

        var totalCameras = DEVICES.length;
        //If couldnt find a suitable camera, pick the last one... you can change to what works for you
        if(final == null)
        {
            //console.log("no suitable camera, getting the last one");
            final = DEVICES[totalCameras-1];
        };
        //Set the constraints and call getUserMedia
        var constraints = {
            audio: false, 
            video: {
                deviceId: {exact: final.deviceId}
                }
        };

        navigator.mediaDevices
        .getUserMedia(constraints)
        .then(function(stream) {
            track = stream.getTracks()[0];
            cameraView.srcObject = stream;
        })
        .catch(function(error) {
            console.error("Oops. Something is broken.", error);
        });

    })
    .catch(function(err) {
        console.log(err.name + ": " + err.message);
    });
};

// Take a picture when cameraTrigger is tapped
cameraTrigger.onclick = function() {
    cameraSensor.width = cameraView.videoWidth;
    cameraSensor.height = cameraView.videoHeight;
    cameraSensor.getContext("2d").drawImage(cameraView, 0, 0);
    cameraOutput.src = cameraSensor.toDataURL("image/webp");
    cameraOutput.classList.add("taken");
};

submitTrigger.onclick = function() {
    data = cameraOutput.src
    $.ajax({
        url: inference_url,
        type: 'POST',
        contentType: 'application/octet-stream',  
        data: data,
        processData: false
    }).done(function(ret) {
        //$("#camera--view").css("visibility", "hidden");
        //$("#camera--sensor").css("visibility", "hidden");
        $("#results--view").css("visibility", "visible");
        $("#results--view").html(JSON.parse(ret)["results"][0]);
        //alert(ret);
    });
};

feedbackTrigger.onclick = function() {
    imgData = cameraOutput.src
    var object_key = new Date().getTime() + ".png"
    data = {
        "auth_data":{"user_name":"mlhere.io@gmail.com", "auth_data":"key"},
        "object":{
            "object_key":$("#type-select").val() + "/" + object_key,
            "type":"png",
            "content":imgData.substring(23)
        },
        "meta_data":{
            "label":$("#type-select").val()
        }
    }

    $.ajax({
        url: feedback_url,
        type: 'POST',
        contentType: 'application/json',  
        data: JSON.stringify(data),
        dataType: "json"
        //processData: false
    }).done(function(ret) {
        if("undefined" === typeof(ret["error"])){
            alert("OK");
        }else{
            alert(ret["error"])
            // The property exists
        }
        //alert(ret);
    });
};

//Return to camera.
returnTrigger.onclick = function() {
    $("#camera--view").css("visibility", "visible");
    $("#camera--sensor").css("visibility", "visible");
    $("#results--view").css("visibility", "hidden");
    $("#results--view").html("");
};

// Start the video stream when the window loads
window.addEventListener("load", cameraStart, false);
//window.open(inference_url, '_blank');
