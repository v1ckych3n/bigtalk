// temporary workaround to make sure the correct version of CSS is loaded
function replaceCssHref(targetCss, newCss) {
    var linkTag = document.querySelector('link[href*="' + targetCss + '"]');
    if(linkTag === null) {
      return;
    }
    newHref = linkTag.getAttribute('href').replace(targetCss, newCss);
    linkTag.setAttribute('href', newHref);
  }
  
  replaceCssHref('pipe.css', 'pipe.css?v=2');
  (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
  module.exports = pipeDesktopUploader = {
  
      options: {},
      connectionFallback: false,
  
      addPipeDesktopUploader: function (pipeElement, pipeVars, extraParams) {
  
          var retryAttempt = 0;
  
          pipeDesktopUploader.options = {
              beforeSend: beforeSubmit,
              success: afterSuccess,
              xhr: OnProgress,
              error: onError
          };
  
          function beforeSubmit() {
              if (window.File && window.FileReader && window.FileList && window.Blob) {
                  pq.$('#output-' + pipeElement).css('color', normalCol).html("");
                  if (!pq.$('#pipeStartUploading-' + pipeElement).val()) {
                      return false;
                  }
  
                  //========== Desktop Upload API ================
                  var nameParts = pq.$('#pipeStartUploading-' + pipeElement).val().split(".");
                  var filetype = nameParts[nameParts.length - 1];
                  var filename = pq.$('#pipeStartUploading-' + pipeElement).val().replace("." + filetype, "");
  
                  if (pipeVars["ao"] == 1) {
                      //event API call
                      PipeSDK.recorders[pipeElement].onDesktopVideoUploadStarted(pipeElement, filename, filetype, true);
                  } else {
                      //event API call
                      PipeSDK.recorders[pipeElement].onDesktopVideoUploadStarted(pipeElement, filename, filetype, false);
                  }
  
                  //=======================================
  
                  var ftype = pq.$('#pipeStartUploading-' + pipeElement).files(0).type;
  
                  if (pipeVars["ao"] == 0) {
                      if (ftype.indexOf("audio/") != -1) {
                          pq.$("#output-" + pipeElement).html("<b>" + ftype + "</b> " + extraParams.unsupportedTxt);
                          return false;
                      }
                  }
  
                  switch (ftype) {
  
                      case 'video/mp4':
                      case 'video/quicktime':
                      case 'video/webm':
                      case 'video/3gpp':
                      case 'video/3gpp2':
                      case 'video/x-flv':
                      case 'video/x-msvideo':
                      case 'video/avi':
                      case 'video/x-ms-wmv':
                      case 'video/x-matroska':
                      case 'video/mpeg':
                      case 'audio/aac':
                      case 'audio/webm':
                      case 'audio/3gpp':
                      case 'audio/3gpp2':
                      case 'audio/mp4':
                      case 'audio/mpeg':
                      case 'audio/m4a':
                      case 'audio/x-m4a':
                      case 'audio/mp3':
                      case 'audio/x-wav':
                      case 'audio/wav':
                      case 'audio/ogg':
                      case 'audio/x-ms-wma':
                      case 'audio/flac':
                      case 'audio/amr':
                          break;
                      default:
                          pq.$("#output-" + pipeElement).html("<b>" + ftype + "</b> " + extraParams.unsupportedTxt);
                          return false;
                  }
  
                  //check file size
                  var fileSize = pq.$('#pipeStartUploading-' + pipeElement).files(0).size;
                  if (fileSize > pipeVars["recordingSizeLimit"]) {
                      // max size
                      pq.$("#output-" + pipeElement).html(extraParams.maxFileSizeTxt + " " + pipeVars["recordingSizeLimit"] / 1024 / 1024 / 1024 + " GiB");
                      return false;
                  }
  
                  pq.$('#output-' + pipeElement).html(extraParams.uploadingTxt + '...0%');
              } else {
                  pq.$("#output-" + pipeElement).html(extraParams.upgradeTxt);
                  return false;
              }
          }
  
          function OnProgress(jqXHR) {
              pq.$(`#pipeStartRecording-${pipeElement} #pipe-upload-wrap-${pipeElement} #pipeRecordScreen-${pipeElement}`).hide();
  
              if (jqXHR === null) {
                  if (window.ActiveXObject) {
                      jqXHR = new window.ActiveXObject("Microsoft.XMLHTTP");
                  } else {
                      jqXHR = new window.XMLHttpRequest();
                  }
              }
              //Upload progress
              jqXHR.upload.addEventListener("progress", function (evt) {
                  if (evt.lengthComputable) {
                      var percentComplete = Math.round(evt.loaded * 100 / evt.total);
  
                      pq.$('#output-' + pipeElement).html(extraParams.uploadingTxt + '...' + percentComplete + '%');
  
                      //event API call
                      PipeSDK.recorders[pipeElement].onDesktopVideoUploadProgress(pipeElement, percentComplete);
                  }
              }, false);
              return jqXHR;
          }
  
          function onError(xhr, textStatus, errorThrown) {
              if (xhr.status == 400 || xhr.status == 500) {
                  responseText = JSON.parse(xhr.responseText);
                  pq.$("#output-" + pipeElement).html(responseText.d);
                  return;
              }
  
              retryAttempt++;
  
              pq.$("#output-" + pipeElement).html("Connection lost, retrying...");
  
              //after 3 unsuccessful attempts, if there is a fallback server, we attempt a fallback
              if (retryAttempt == 3 && html5FallbackServer != "") {
                  console.log("Server did not respond, falling back to the other US region");
                  html5Server = html5FallbackServer;
                  storageS3Location = storageS3FallbackLocation;
                  pipeDesktopUploader.connectionFallback = true;
              }
  
              setTimeout(pipeDesktopUploader.sendData, 1500, pipeElement, pipeVars, pipeDesktopUploader.options);
          }
  
          function afterSuccess(data) {
              // SVG Icon
              const doneSVG = '<svg height="30px" id="Layer_1" style="enable-background:new 0 0 512 512;style="vertical-align: middle;" version="1.1" viewBox="0 0 512 512" width="30px" xml:space="preserve" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><style type="text/css">.st0{fill:#2BB673;}.st1{fill:none;stroke:#FFFFFF;stroke-width:30;stroke-miterlimit:10;}</style><path class="st0" d="M489,255.9c0-0.2,0-0.5,0-0.7c0-1.6,0-3.2-0.1-4.7c0-0.9-0.1-1.8-0.1-2.8c0-0.9-0.1-1.8-0.1-2.7  c-0.1-1.1-0.1-2.2-0.2-3.3c0-0.7-0.1-1.4-0.1-2.1c-0.1-1.2-0.2-2.4-0.3-3.6c0-0.5-0.1-1.1-0.1-1.6c-0.1-1.3-0.3-2.6-0.4-4  c0-0.3-0.1-0.7-0.1-1C474.3,113.2,375.7,22.9,256,22.9S37.7,113.2,24.5,229.5c0,0.3-0.1,0.7-0.1,1c-0.1,1.3-0.3,2.6-0.4,4  c-0.1,0.5-0.1,1.1-0.1,1.6c-0.1,1.2-0.2,2.4-0.3,3.6c0,0.7-0.1,1.4-0.1,2.1c-0.1,1.1-0.1,2.2-0.2,3.3c0,0.9-0.1,1.8-0.1,2.7  c0,0.9-0.1,1.8-0.1,2.8c0,1.6-0.1,3.2-0.1,4.7c0,0.2,0,0.5,0,0.7c0,0,0,0,0,0.1s0,0,0,0.1c0,0.2,0,0.5,0,0.7c0,1.6,0,3.2,0.1,4.7  c0,0.9,0.1,1.8,0.1,2.8c0,0.9,0.1,1.8,0.1,2.7c0.1,1.1,0.1,2.2,0.2,3.3c0,0.7,0.1,1.4,0.1,2.1c0.1,1.2,0.2,2.4,0.3,3.6  c0,0.5,0.1,1.1,0.1,1.6c0.1,1.3,0.3,2.6,0.4,4c0,0.3,0.1,0.7,0.1,1C37.7,398.8,136.3,489.1,256,489.1s218.3-90.3,231.5-206.5  c0-0.3,0.1-0.7,0.1-1c0.1-1.3,0.3-2.6,0.4-4c0.1-0.5,0.1-1.1,0.1-1.6c0.1-1.2,0.2-2.4,0.3-3.6c0-0.7,0.1-1.4,0.1-2.1  c0.1-1.1,0.1-2.2,0.2-3.3c0-0.9,0.1-1.8,0.1-2.7c0-0.9,0.1-1.8,0.1-2.8c0-1.6,0.1-3.2,0.1-4.7c0-0.2,0-0.5,0-0.7  C489,256,489,256,489,255.9C489,256,489,256,489,255.9z" id="XMLID_3_"/><g id="XMLID_1_"><line class="st1" id="XMLID_2_" x1="213.6" x2="369.7" y1="344.2" y2="188.2"/><line class="st1" id="XMLID_4_" x1="233.8" x2="154.7" y1="345.2" y2="266.1"/></g></svg>';
  
              var res = JSON.parse(data);
              if (res.s == 1) {
                  pq.$("#output-" + pipeElement).html('<div style="display:flex;align-items:center;">' + doneSVG + '&nbsp; ' + extraParams.doneTxt + '</div>').css('color', extraParams.normalCol);
                  pq.$("#uploadAnother-" + pipeElement).show();
  
                  var fileName = res.f;
  
                  //============= Desktop Upload API ====================
                  var name = fileName.split(".")[0];
                  var type = fileName.split(".")[1];
  
                  if (pipeVars["ao"] == 1) {
                      //event API call
                      PipeSDK.recorders[pipeElement].onDesktopVideoUploadSuccess(pipeElement, name, type, res.id, true, storageS3Location);
                  } else {
                      //event API call
                      PipeSDK.recorders[pipeElement].onDesktopVideoUploadSuccess(pipeElement, name, type, res.id, false, storageS3Location);
                  }
  
                  pq.$("#uploadAnother-" + pipeElement).click(showInitScreen).keydown(function (event) {
                      if (event.which == 13) {
                          event.preventDefault();
                          showInitScreen();
                      }
                  });
              } else if (res.s == 0) {
  
                  if (pipeVars["accountHash"] == "NON-EXISTENT-HASH-SO-THAT-THE-VIDEOS-ARE-NOT-PROCESSED-AT-ALL") {
                      pq.$("#output-" + pipeElement).html('<div style="display:flex;align-items:center;">' + doneSVG + '&nbsp; ' + extraParams.doneTxt + '</div>').css('color', extraParams.normalCol);
  
                      pq.$("#uploadAnother-" + pipeElement).show().click(showInitScreen).keydown(function (event) {
                          if (event.which == 13) {
                              event.preventDefault();
                              showInitScreen();
                          }
                      });
                  } else {
                      pq.$("#output-" + pipeElement).html(extraParams.uploadFailedTxt).css('color', '#f00');
  
                      //=========== Desktop Upload API =================
  
                      //event API call
                      PipeSDK.recorders[pipeElement].onDesktopVideoUploadFailed(pipeElement, res.e);
                  }
              }
              //reset the file input
              pq.$('#pipeStartUploading-' + pipeElement).val("");
          }
  
          function showInitScreen() {
              pq.$('#pipeStartRecording-' + pipeElement).show();
              if (pipeVars["avrec"] == 0) {
                  pq.$('#pipeStartRecording-' + pipeElement).hide().off("click").off("keydown");
              }
              pq.$('#pipe-upload-wrap-' + pipeElement).show();
              if (pipeVars["srec"] && pipeVars["srec"] != 0 && (extraParams.accType == 50 || extraParams.accType == 1) && extraParams.webRtcClient == true && navigator.userAgent.toLowerCase().indexOf("android") == -1) {
                  if ("mediaDevices" in navigator && "getDisplayMedia" in navigator.mediaDevices) {
                      if ("getUserMedia" in navigator || "mediaDevices" in navigator && "getUserMedia" in navigator.mediaDevices) {
                          if (typeof MediaRecorder === "function") {
                              if ("readyState" in MediaStreamTrack.prototype) {
                                  pq.$('#pipeRecordScreen-' + pipeElement).show();
                              }
                          }
                      }
                  }
              }
              pq.$("#uploadAnother-" + pipeElement).hide();
              pq.$("#output-" + pipeElement).html("");
          }
      },
  
      //construct and send data
      sendData: function (pipeElement, pipeVars, options) {
          var formData = new FormData();
  
          if (pipeDesktopUploader.connectionFallback == true) {
              formData.append('fallback', true);
          }
  
          formData.append('deskUp', "deskUp");
          formData.append('accountHash', pipeVars["accountHash"]);
          formData.append('payload', pipeVars["payload"] ? encodeURIComponent(pipeVars["payload"]) : '');
          formData.append('httpReferer', encodeURIComponent(window.location.href));
          formData.append('mrt', pipeVars["mrt"]);
          formData.append('environmentId', pipeVars["eid"] ? pipeVars["eid"] : '1');
          formData.append('audioOnly', pipeVars["ao"] ? pipeVars["ao"] : '0');
          formData.append('build', pipeVars["build"]);
          formData.append('pipeRecorderId', pipeVars["recorderId"]);
          formData.append('FileInput', pq.$('#pipeStartUploading-' + pipeElement).files(0));
  
          pq.ajax({
              url: "https://" + html5Server + "/upload",
              method: "POST",
              data: formData,
              beforeSend: options.beforeSend,
              success: options.success,
              xhr: options.xhr,
              error: options.error
          });
      }
  };
  
  },{}],2:[function(require,module,exports){
  module.exports = pipeMobileRecorder = {
  
    addPipeMobileRecorder: function (pipeElement, pipeVars) {
  
      var wasDisconnected = false;
      var retryAttempt = 0;
      var connectionFallback = false;
  
      //language detection. Default is English
      var langCode = "en";
      if (prefLang == "fr" || prefLang == "de" || prefLang == "es") {
        langCode = prefLang;
      }
  
      languageFileURL = "https://cdn.addpipe.com/2.0/" + (pipeVars["lang"] ? pipeVars["lang"] : 'translations/' + langCode + '.xml');
      if (pipeVars["lang"]) {
        if (pipeVars["lang"].indexOf("http") != -1) {
          languageFileURL = pipeVars["lang"];
        }
      }
  
      //load the language XML file
      pq.ajax({
        url: languageFileURL,
        dataType: 'xml',
        success: function (data) {
  
          var xml_node = pq.$('xliff', data);
  
          if (pipeVars["dpv"] == 0 || pipeVars["dpv"] == undefined) {
            btnRecTxt = xml_node.find('xliff > file > body > trans-unit[resname="IDS_MOBILE_BTN_RECORD"] > source').text();
          } else {
            btnRecTxt = xml_node.find('xliff > file > body > trans-unit[resname="IDS_BT_RECORD"] > source').text();
          }
  
          //loading error text for iOS
          if (pipeVars["ao"] == 1) {
            iOSErrorTxt = xml_node.find('xliff > file > body > trans-unit[resname="IDS_MOBILE_BTN_RECORD_AUDIO_IOS_ERROR"] > source').text();
  
            if (iOSErrorTxt == "") {
              iOSErrorTxt = "Audio only recording is not possible on iOS";
            }
          }
  
          //check if the client has an old version of XML file without the mobile translations
  
          if (btnRecTxt != "") {
  
            if (pipeVars["ao"] == 1) {
              if (pipeVars["dpv"] == 0 || pipeVars["dpv"] == undefined) {
                btnRecTxt = xml_node.find('xliff > file > body > trans-unit[resname="IDS_MOBILE_BTN_RECORD_AUDIO"] > source').text();
                if (btnRecTxt == "") {
                  btnRecTxt = "Record or select an audio file";
                }
              } else {
                btnRecTxt = xml_node.find('xliff > file > body > trans-unit[resname="IDS_BT_RECORD"] > source').text();
                if (btnRecTxt == "") {
                  btnRecTxt = "Record";
                }
              }
            }
  
            btnUploadTxt = xml_node.find('xliff > file > body > trans-unit[resname="IDS_MOBILE_BTN_UPLOAD"] > source').text();
            maintenanceTxt = xml_node.find('xliff > file > body > trans-unit[resname="IDS_OFFLINE"] > source').text();
            selectVidTxt = xml_node.find('xliff > file > body > trans-unit[resname="IDS_MOBILE_SELECT_VID"] > source').text();
            uploadingTxt = xml_node.find('xliff > file > body > trans-unit[resname="IDS_MOBILE_UPLOADING"] > source').text();
            unsupportedTxt = xml_node.find('xliff > file > body > trans-unit[resname="IDS_MOBILE_UNSUPPORTED"] > source').text();
            maxFileSizeTxt = xml_node.find('xliff > file > body > trans-unit[resname="IDS_MAX_UPLOAD_SIZE"] > source').text();
            upgradeTxt = xml_node.find('xliff > file > body > trans-unit[resname="IDS_MOBILE_UPGRADE"] > source').text();
            doneTxt = xml_node.find('xliff > file > body > trans-unit[resname="IDS_MOBILE_DONE"] > source').text();
            uploadAnotherTxt = xml_node.find('xliff > file > body > trans-unit[resname="IDS_UPLOAD_AGAIN_DESKTOP"] > source').text();
            accountClosedTxt = xml_node.find('xliff > file > body > trans-unit[resname="IDS_MOBILE_ACC_DISABLED"] > source').text();
            uploadFailedTxt = xml_node.find('xliff > file > body > trans-unit[resname="IDS_MOBILE_UPLOAD_FAILED"] > source').text();
          } else {
  
            //Default is English
  
            if (pipeVars["ao"] == 1) {
              if (pipeVars["dpv"] == 0 || pipeVars["dpv"] == undefined) {
                btnRecTxt = "Record or select an audio file";
              } else {
                btnRecTxt = "Record";
              }
            } else {
              if (pipeVars["dpv"] == 0 || pipeVars["dpv"] == undefined) {
                btnRecTxt = "Record or select a video file";
              } else {
                btnRecTxt = "Record";
              }
            }
  
            btnUploadTxt = "Upload";
            maintenanceTxt = "Video recording is in maintenance. Try again in a few minutes.";
            selectVidTxt = "Please select or record a video before uploading.";
            uploadingTxt = "Uploading";
            unsupportedTxt = "Unsupported file type!";
            maxFileSizeTxt = "Maximum allowed file size is";
            upgradeTxt = "Please upgrade your browser! Your current one lacks the features needed to record & submit videos.";
            doneTxt = "Done!";
            uploadAnotherTxt = "Record or upload another one";
            accountClosedTxt = "Pipe account has been disabled";
            uploadFailedTxt = "Upload failed!";
  
            if (langCode == "de") {
  
              btnRecTxt = "Video aufnehmen";
              btnUploadTxt = "Hochladen";
              maintenanceTxt = "Video-Aufzeichnung ist in Wartung. Versuchen Sie es erneut in ein paar Minuten.";
              selectVidTxt = "Bitte wÃ¤hlen Sie oder ein Video aufnehmen , bevor das Hochladen.";
              uploadingTxt = "Hochladen";
              unsupportedTxt = "Nicht unterstÃ¼tztes Dateiformat!";
              maxFileSizeTxt = "Die maximal zulÃ¤ssige DateigrÃ¶ÃŸe betrÃ¤gt";
              upgradeTxt = "Bitte aktualisieren Sie Ihren Browser! Ihre aktuellen fehlen die notwendigen Funktionen zur Aufzeichnung und Videos einreichen.";
              doneTxt = "Gemacht!";
              uploadAnotherTxt = "Nehmen Sie oder eine andere laden";
              accountClosedTxt = "Pipe Konto wurde deaktiviert";
              uploadFailedTxt = "Upload fehlgeschlagen!";
            } else if (langCode == "fr") {
  
              btnRecTxt = "Enregistrer ou sÃ©lectionnez un fichier vidÃ©o";
              btnUploadTxt = "TÃ©lÃ©charger";
              maintenanceTxt = "L'enregistrement vidÃ©o est en maintenance . Essayez Ã  nouveau dans quelques minutes.";
              selectVidTxt = "S'il vous plaÃ®t sÃ©lectionner ou enregistrer une vidÃ©o avant de tÃ©lÃ©charger.";
              uploadingTxt = "Uploading";
              unsupportedTxt = "Type de fichier non pris en charge!";
              maxFileSizeTxt = "La taille de fichier maximale autorisÃ©e est de";
              upgradeTxt = "S'il vous plaÃ®t mettre Ã  jour votre navigateur ! Votre actuel n'a pas les caractÃ©ristiques nÃ©cessaires pour enregistrer et soumettre des vidÃ©os.";
              doneTxt = "TerminÃ©";
              uploadAnotherTxt = "Enregistrer ou tÃ©lÃ©charger un autre";
              accountClosedTxt = "Compte Pipe a Ã©tÃ© dÃ©sactivÃ©";
              uploadFailedTxt = "Ã‰chec de l'envoi!";
            } else if (langCode == "es") {
  
              btnRecTxt = "Grabar o seleccionar un archivo de vÃ­deo";
              btnUploadTxt = "Subir";
              maintenanceTxt = "La grabaciÃ³n de vÃ­deo se encuentra en mantenimiento. Vuelva a intentarlo en unos minutos.";
              selectVidTxt = "Por favor seleccione o grabar un vÃ­deo antes de subir.";
              uploadingTxt = "Subiendo";
              unsupportedTxt = "Tipo de archivo no soportado!";
              maxFileSizeTxt = "El tamaÃ±o mÃ¡ximo de archivo permitido es";
              upgradeTxt = "Por favor , actualice su navegador! Su actual carece de las caracterÃ­sticas necesarias para grabar y enviar videos";
              doneTxt = "EstÃ¡ hecho";
              uploadAnotherTxt = "Grabar o subir otro";
              accountClosedTxt = "Cuenta de Pipe se ha desactivado";
              uploadFailedTxt = "Subida fallida!";
            }
          }
  
          btnRecTxt = btnRecTxt.replace("1. ", "");
  
          //==========================================
          if (closedAccount == 0) {
  
            if (maintenance == 0) {
              capture = "";
              if (pipeVars["dpv"] == 1) {
                capture = "capture";
                uploadAnotherTxt = uploadAnotherTxt.replace("or upload", "");
              }
  
              // If a specific facing-mode is requested ("capture")
              if (pipeVars["capture"] === "user") {
                capture = 'capture="user"';
              } else if (pipeVars["capture"] === "environment") {
                capture = 'capture="environment"';
              }
  
              accept = 'accept="video/*"';
              if (pipeVars["ao"] == 1) {
                accept = 'accept="audio/*"';
  
                var iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
                if (iOS == true) {
                  pq.$("#" + pipeElement).append('<div>' + iOSErrorTxt + '</div>');
                  return;
                }
              }
  
              pq.$("#" + pipeElement).append('<div id="pipe-recording-form-' + pipeElement + '"><label id="label-pipe-file-input-' + pipeElement + '" class="pipeFileInput" for="pipe-file-input-' + pipeElement + '">' + btnRecTxt + '</label><input name="FileInput" class="pipeStartUploading" id="pipe-file-input-' + pipeElement + '" type="file" ' + accept + ' value="Start Recording" ' + capture + '/></div><div id="output-' + pipeElement + '"></div>').addClass("pipeMobileRecorder");
            } else {
              pq.$("#" + pipeElement).append('<div style="text-align:center;">' + maintenanceTxt + '</div>');
            }
          } else {
            //closedAccount is 1; precheck errored out for some reason
            var displayedMessage = accountClosedTxt;
            if (precheckError) {
              displayedMessage = precheckError;
            }
            pq.$("#" + pipeElement).append('<div class="pipeDisplayedMessage">' + displayedMessage + '</div>');
          }
  
          function beforeSubmit() {
            console.log("beforeSubmit()");
            if (window.File && window.FileReader && window.FileList && window.Blob) {
              pq.$('#output-' + pipeElement).css('color', '#000');
              if (wasDisconnected == false) {
                pq.$("#output-" + pipeElement).html("");
              }
              if (!pq.$('#pipe-file-input-' + pipeElement).val()) {
                pq.$("#output-" + pipeElement).html(selectVidTxt);
                return false;
              }
  
              var ftype = pq.$('#pipe-file-input-' + pipeElement).files(0).type;
  
              switch (ftype) {
  
                case 'video/mp4':
                case 'video/quicktime':
                case 'video/webm':
                case 'video/3gpp':
                case 'video/3gpp2':
                case 'video/x-flv':
                case 'video/x-msvideo':
                case 'video/avi':
                case 'video/x-ms-wmv':
                case 'video/x-matroska':
                case 'video/mpeg':
                case 'audio/aac':
                case 'audio/webm':
                case 'audio/3gpp':
                case 'audio/3gpp2':
                case 'audio/mp4':
                case 'audio/mpeg':
                case 'audio/m4a':
                case 'audio/x-m4a':
                case 'audio/mp3':
                case 'audio/x-wav':
                case 'audio/wav':
                case 'audio/ogg':
                case 'audio/x-ms-wma':
                case 'audio/flac':
                case 'audio/amr':
                  break;
                default:
                  pq.$("#output-" + pipeElement).html("<b>" + ftype + "</b> " + unsupportedTxt);
                  return false;
              }
  
              //check file size
              var fileSize = pq.$('#pipe-file-input-' + pipeElement).files(0).size;
              if (fileSize > pipeVars["recordingSizeLimit"]) {
                // max size
                pq.$("#output-" + pipeElement).html(maxFileSizeTxt + " " + pipeVars["recordingSizeLimit"] / 1024 / 1024 / 1024 + " GiB");
                return false;
              }
  
              //disable button click
              pq.$('#pipe-file-input-' + pipeElement).prop('disabled', true);
              pq.$('#label-pipe-file-input-' + pipeElement).css("opacity", "0.7").html(uploadingTxt + '...0%');
            } else {
              pq.$("#output-" + pipeElement).html(upgradeTxt);
              return false;
            }
          }
  
          function OnProgress(jqXHR) {
            if (jqXHR === null) {
              if (window.ActiveXObject) {
                jqXHR = new window.ActiveXObject("Microsoft.XMLHTTP");
              } else {
                jqXHR = new window.XMLHttpRequest();
              }
            }
  
            //Upload progress
            jqXHR.upload.addEventListener("progress", function (evt) {
              if (evt.lengthComputable) {
                var percentComplete = Math.round(evt.loaded * 100 / evt.total);
  
                //console.log( 'Uploaded percent', percentComplete );
                pq.$('#label-pipe-file-input-' + pipeElement).html(uploadingTxt + '...' + percentComplete + '%');
  
                //event API call
                PipeSDK.recorders[pipeElement].onVideoUploadProgress(pipeElement, percentComplete);
  
                if (wasDisconnected == true) {
                  pq.$("#output-" + pipeElement).html("");
                  wasDisconnected = false;
                }
              }
            }, false);
  
            return jqXHR;
          }
  
          function onError(xhr, textStatus, errorThrown) {
            if (xhr.status == 400 || xhr.status == 500) {
              responseText = JSON.parse(xhr.responseText);
              pq.$("#output-" + pipeElement).html(responseText.d);
              return;
            }
  
            retryAttempt++;
  
            if (wasDisconnected == false) {
              pq.$("#output-" + pipeElement).html("Connection lost, retrying...");
              wasDisconnected = true;
            }
  
            //after 3 unsuccessful attempts, if there is a fallback server, we attempt a fallback
            if (retryAttempt == 3 && html5FallbackServer != "") {
              console.log("Server did not respond, falling back to the other US region");
              html5Server = html5FallbackServer;
              storageS3Location = storageS3FallbackLocation;
              connectionFallback = true;
            }
  
            setTimeout(sendData, 1500);
          }
  
          function afterSuccess(data) {
            console.log("afterSuccess()");
  
            //enable button click
            pq.$('#label-pipe-file-input-' + pipeElement).css("opacity", "1");
            pq.$('#pipe-file-input-' + pipeElement).prop('disabled', false);
  
            var res = JSON.parse(data);
            if (res.s == 1) {
              pq.$('#label-pipe-file-input-' + pipeElement).html(doneTxt + " " + uploadAnotherTxt);
              var fileName = res.f;
  
              //upload success mobile API
              var name = fileName.split(".")[0];
              var type = fileName.split(".")[1];
  
              var location = "addpipevideos.s3.amazonaws.com";
              if (name.length == 32) {
                location = storageS3Location;
              }
  
              if (pipeVars["ao"] == 1) {
                //event API call
                PipeSDK.recorders[pipeElement].onVideoUploadSuccess(pipeElement, name, type, res.id, true, location);
              } else {
                //event API call
                PipeSDK.recorders[pipeElement].onVideoUploadSuccess(pipeElement, name, type, res.id, false, location);
              }
            } else if (res.s == 0) {
  
              if (res.e == "expired" || res.e == "closed") {
                alert(accountClosedTxt);
  
                //event API call
                PipeSDK.recorders[pipeElement].onVideoUploadFailed(pipeElement, res.e);
              } else {
  
                if (pipeVars["accountHash"] == "NON-EXISTENT-HASH-SO-THAT-THE-VIDEOS-ARE-NOT-PROCESSED-AT-ALL") {
                  pq.$('#label-pipe-file-input-' + pipeElement).html(doneTxt + " " + uploadAnotherTxt);
                } else {
                  pq.$('#label-pipe-file-input-' + pipeElement).html(uploadFailedTxt + " " + uploadAnotherTxt);
  
                  //event API call
                  PipeSDK.recorders[pipeElement].onVideoUploadFailed(pipeElement, res.e);
                }
              }
            }
  
            //reset the file input
            pq.$('#pipe-file-input-' + pipeElement).val("");
          }
  
          //====== Mobile API ======
          pq.$('#pipe-file-input-' + pipeElement).on("change", function (e) {
            $in = pq.$("#" + this.id);
            if ($in.val() != "") {
              var nameParts = $in.val().split(".");
              var filetype = nameParts[nameParts.length - 1];
              var filename = $in.val().replace("." + filetype, "");
  
              sendData();
  
              if (pipeVars["ao"] == 1) {
                //event API call
                PipeSDK.recorders[pipeElement].onVideoUploadStarted(pipeElement, filename, filetype, true);
              } else {
                //event API call
                PipeSDK.recorders[pipeElement].onVideoUploadStarted(pipeElement, filename, filetype, false);
              }
            }
          });
  
          //construct and send data
          function sendData() {
            var formData = new FormData();
  
            if (connectionFallback == true) {
              formData.append('fallback', true);
            }
  
            formData.append('mobUp', "mobUp");
            formData.append('accountHash', pipeVars["accountHash"]);
            formData.append('payload', pipeVars["payload"] ? encodeURIComponent(pipeVars["payload"]) : '');
            formData.append('httpReferer', encodeURIComponent(window.location.href));
            formData.append('mrt', pipeVars["mrt"]);
            formData.append('environmentId', pipeVars["eid"] ? pipeVars["eid"] : '1');
            formData.append('audioOnly', pipeVars["ao"] ? pipeVars["ao"] : '0');
            formData.append('build', pipeVars["build"]);
            formData.append('pipeRecorderId', pipeVars["recorderId"]);
            formData.append('FileInput', pq.$('#pipe-file-input-' + pipeElement).files(0));
  
            pq.ajax({
              url: "https://" + html5Server + "/upload",
              method: "POST",
              data: formData,
              beforeSend: beforeSubmit,
              success: afterSuccess,
              xhr: OnProgress,
              error: onError
            });
          }
        },
        async: false
      });
    }
  
  };
  
  },{}],3:[function(require,module,exports){
  /*!
   * Socket.IO v4.7.5
   * (c) 2014-2024 Guillermo Rauch
   * Released under the MIT License.
   */
  !function(e,t){"object"==typeof exports&&"undefined"!=typeof module?module.exports=t():"function"==typeof define&&define.amd?define(t):(e="undefined"!=typeof globalThis?globalThis:e||self).io=t()}(this,(function(){"use strict";function e(t){return e="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(e){return typeof e}:function(e){return e&&"function"==typeof Symbol&&e.constructor===Symbol&&e!==Symbol.prototype?"symbol":typeof e},e(t)}function t(e,t){if(!(e instanceof t))throw new TypeError("Cannot call a class as a function")}function n(e,t){for(var n=0;n<t.length;n++){var r=t[n];r.enumerable=r.enumerable||!1,r.configurable=!0,"value"in r&&(r.writable=!0),Object.defineProperty(e,(i=r.key,o=void 0,"symbol"==typeof(o=function(e,t){if("object"!=typeof e||null===e)return e;var n=e[Symbol.toPrimitive];if(void 0!==n){var r=n.call(e,t||"default");if("object"!=typeof r)return r;throw new TypeError("@@toPrimitive must return a primitive value.")}return("string"===t?String:Number)(e)}(i,"string"))?o:String(o)),r)}var i,o}function r(e,t,r){return t&&n(e.prototype,t),r&&n(e,r),Object.defineProperty(e,"prototype",{writable:!1}),e}function i(){return i=Object.assign?Object.assign.bind():function(e){for(var t=1;t<arguments.length;t++){var n=arguments[t];for(var r in n)Object.prototype.hasOwnProperty.call(n,r)&&(e[r]=n[r])}return e},i.apply(this,arguments)}function o(e,t){if("function"!=typeof t&&null!==t)throw new TypeError("Super expression must either be null or a function");e.prototype=Object.create(t&&t.prototype,{constructor:{value:e,writable:!0,configurable:!0}}),Object.defineProperty(e,"prototype",{writable:!1}),t&&a(e,t)}function s(e){return s=Object.setPrototypeOf?Object.getPrototypeOf.bind():function(e){return e.__proto__||Object.getPrototypeOf(e)},s(e)}function a(e,t){return a=Object.setPrototypeOf?Object.setPrototypeOf.bind():function(e,t){return e.__proto__=t,e},a(e,t)}function c(){if("undefined"==typeof Reflect||!Reflect.construct)return!1;if(Reflect.construct.sham)return!1;if("function"==typeof Proxy)return!0;try{return Boolean.prototype.valueOf.call(Reflect.construct(Boolean,[],(function(){}))),!0}catch(e){return!1}}function u(e,t,n){return u=c()?Reflect.construct.bind():function(e,t,n){var r=[null];r.push.apply(r,t);var i=new(Function.bind.apply(e,r));return n&&a(i,n.prototype),i},u.apply(null,arguments)}function h(e){var t="function"==typeof Map?new Map:void 0;return h=function(e){if(null===e||(n=e,-1===Function.toString.call(n).indexOf("[native code]")))return e;var n;if("function"!=typeof e)throw new TypeError("Super expression must either be null or a function");if(void 0!==t){if(t.has(e))return t.get(e);t.set(e,r)}function r(){return u(e,arguments,s(this).constructor)}return r.prototype=Object.create(e.prototype,{constructor:{value:r,enumerable:!1,writable:!0,configurable:!0}}),a(r,e)},h(e)}function f(e){if(void 0===e)throw new ReferenceError("this hasn't been initialised - super() hasn't been called");return e}function l(e){var t=c();return function(){var n,r=s(e);if(t){var i=s(this).constructor;n=Reflect.construct(r,arguments,i)}else n=r.apply(this,arguments);return function(e,t){if(t&&("object"==typeof t||"function"==typeof t))return t;if(void 0!==t)throw new TypeError("Derived constructors may only return object or undefined");return f(e)}(this,n)}}function p(){return p="undefined"!=typeof Reflect&&Reflect.get?Reflect.get.bind():function(e,t,n){var r=function(e,t){for(;!Object.prototype.hasOwnProperty.call(e,t)&&null!==(e=s(e)););return e}(e,t);if(r){var i=Object.getOwnPropertyDescriptor(r,t);return i.get?i.get.call(arguments.length<3?e:n):i.value}},p.apply(this,arguments)}function d(e,t){(null==t||t>e.length)&&(t=e.length);for(var n=0,r=new Array(t);n<t;n++)r[n]=e[n];return r}function y(e,t){var n="undefined"!=typeof Symbol&&e[Symbol.iterator]||e["@@iterator"];if(!n){if(Array.isArray(e)||(n=function(e,t){if(e){if("string"==typeof e)return d(e,t);var n=Object.prototype.toString.call(e).slice(8,-1);return"Object"===n&&e.constructor&&(n=e.constructor.name),"Map"===n||"Set"===n?Array.from(e):"Arguments"===n||/^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)?d(e,t):void 0}}(e))||t&&e&&"number"==typeof e.length){n&&(e=n);var r=0,i=function(){};return{s:i,n:function(){return r>=e.length?{done:!0}:{done:!1,value:e[r++]}},e:function(e){throw e},f:i}}throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.")}var o,s=!0,a=!1;return{s:function(){n=n.call(e)},n:function(){var e=n.next();return s=e.done,e},e:function(e){a=!0,o=e},f:function(){try{s||null==n.return||n.return()}finally{if(a)throw o}}}}var v=Object.create(null);v.open="0",v.close="1",v.ping="2",v.pong="3",v.message="4",v.upgrade="5",v.noop="6";var g=Object.create(null);Object.keys(v).forEach((function(e){g[v[e]]=e}));var m,b={type:"error",data:"parser error"},k="function"==typeof Blob||"undefined"!=typeof Blob&&"[object BlobConstructor]"===Object.prototype.toString.call(Blob),w="function"==typeof ArrayBuffer,_=function(e){return"function"==typeof ArrayBuffer.isView?ArrayBuffer.isView(e):e&&e.buffer instanceof ArrayBuffer},E=function(e,t,n){var r=e.type,i=e.data;return k&&i instanceof Blob?t?n(i):A(i,n):w&&(i instanceof ArrayBuffer||_(i))?t?n(i):A(new Blob([i]),n):n(v[r]+(i||""))},A=function(e,t){var n=new FileReader;return n.onload=function(){var e=n.result.split(",")[1];t("b"+(e||""))},n.readAsDataURL(e)};function O(e){return e instanceof Uint8Array?e:e instanceof ArrayBuffer?new Uint8Array(e):new Uint8Array(e.buffer,e.byteOffset,e.byteLength)}for(var T="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/",R="undefined"==typeof Uint8Array?[]:new Uint8Array(256),C=0;C<64;C++)R[T.charCodeAt(C)]=C;var B,S="function"==typeof ArrayBuffer,N=function(e,t){if("string"!=typeof e)return{type:"message",data:x(e,t)};var n=e.charAt(0);return"b"===n?{type:"message",data:L(e.substring(1),t)}:g[n]?e.length>1?{type:g[n],data:e.substring(1)}:{type:g[n]}:b},L=function(e,t){if(S){var n=function(e){var t,n,r,i,o,s=.75*e.length,a=e.length,c=0;"="===e[e.length-1]&&(s--,"="===e[e.length-2]&&s--);var u=new ArrayBuffer(s),h=new Uint8Array(u);for(t=0;t<a;t+=4)n=R[e.charCodeAt(t)],r=R[e.charCodeAt(t+1)],i=R[e.charCodeAt(t+2)],o=R[e.charCodeAt(t+3)],h[c++]=n<<2|r>>4,h[c++]=(15&r)<<4|i>>2,h[c++]=(3&i)<<6|63&o;return u}(e);return x(n,t)}return{base64:!0,data:e}},x=function(e,t){return"blob"===t?e instanceof Blob?e:new Blob([e]):e instanceof ArrayBuffer?e:e.buffer},P=String.fromCharCode(30);function j(){return new TransformStream({transform:function(e,t){!function(e,t){k&&e.data instanceof Blob?e.data.arrayBuffer().then(O).then(t):w&&(e.data instanceof ArrayBuffer||_(e.data))?t(O(e.data)):E(e,!1,(function(e){m||(m=new TextEncoder),t(m.encode(e))}))}(e,(function(n){var r,i=n.length;if(i<126)r=new Uint8Array(1),new DataView(r.buffer).setUint8(0,i);else if(i<65536){r=new Uint8Array(3);var o=new DataView(r.buffer);o.setUint8(0,126),o.setUint16(1,i)}else{r=new Uint8Array(9);var s=new DataView(r.buffer);s.setUint8(0,127),s.setBigUint64(1,BigInt(i))}e.data&&"string"!=typeof e.data&&(r[0]|=128),t.enqueue(r),t.enqueue(n)}))}})}function q(e){return e.reduce((function(e,t){return e+t.length}),0)}function D(e,t){if(e[0].length===t)return e.shift();for(var n=new Uint8Array(t),r=0,i=0;i<t;i++)n[i]=e[0][r++],r===e[0].length&&(e.shift(),r=0);return e.length&&r<e[0].length&&(e[0]=e[0].slice(r)),n}function U(e){if(e)return function(e){for(var t in U.prototype)e[t]=U.prototype[t];return e}(e)}U.prototype.on=U.prototype.addEventListener=function(e,t){return this._callbacks=this._callbacks||{},(this._callbacks["$"+e]=this._callbacks["$"+e]||[]).push(t),this},U.prototype.once=function(e,t){function n(){this.off(e,n),t.apply(this,arguments)}return n.fn=t,this.on(e,n),this},U.prototype.off=U.prototype.removeListener=U.prototype.removeAllListeners=U.prototype.removeEventListener=function(e,t){if(this._callbacks=this._callbacks||{},0==arguments.length)return this._callbacks={},this;var n,r=this._callbacks["$"+e];if(!r)return this;if(1==arguments.length)return delete this._callbacks["$"+e],this;for(var i=0;i<r.length;i++)if((n=r[i])===t||n.fn===t){r.splice(i,1);break}return 0===r.length&&delete this._callbacks["$"+e],this},U.prototype.emit=function(e){this._callbacks=this._callbacks||{};for(var t=new Array(arguments.length-1),n=this._callbacks["$"+e],r=1;r<arguments.length;r++)t[r-1]=arguments[r];if(n){r=0;for(var i=(n=n.slice(0)).length;r<i;++r)n[r].apply(this,t)}return this},U.prototype.emitReserved=U.prototype.emit,U.prototype.listeners=function(e){return this._callbacks=this._callbacks||{},this._callbacks["$"+e]||[]},U.prototype.hasListeners=function(e){return!!this.listeners(e).length};var I="undefined"!=typeof self?self:"undefined"!=typeof window?window:Function("return this")();function F(e){for(var t=arguments.length,n=new Array(t>1?t-1:0),r=1;r<t;r++)n[r-1]=arguments[r];return n.reduce((function(t,n){return e.hasOwnProperty(n)&&(t[n]=e[n]),t}),{})}var M=I.setTimeout,V=I.clearTimeout;function H(e,t){t.useNativeTimers?(e.setTimeoutFn=M.bind(I),e.clearTimeoutFn=V.bind(I)):(e.setTimeoutFn=I.setTimeout.bind(I),e.clearTimeoutFn=I.clearTimeout.bind(I))}var K,Y=function(e){o(i,e);var n=l(i);function i(e,r,o){var s;return t(this,i),(s=n.call(this,e)).description=r,s.context=o,s.type="TransportError",s}return r(i)}(h(Error)),W=function(e){o(i,e);var n=l(i);function i(e){var r;return t(this,i),(r=n.call(this)).writable=!1,H(f(r),e),r.opts=e,r.query=e.query,r.socket=e.socket,r}return r(i,[{key:"onError",value:function(e,t,n){return p(s(i.prototype),"emitReserved",this).call(this,"error",new Y(e,t,n)),this}},{key:"open",value:function(){return this.readyState="opening",this.doOpen(),this}},{key:"close",value:function(){return"opening"!==this.readyState&&"open"!==this.readyState||(this.doClose(),this.onClose()),this}},{key:"send",value:function(e){"open"===this.readyState&&this.write(e)}},{key:"onOpen",value:function(){this.readyState="open",this.writable=!0,p(s(i.prototype),"emitReserved",this).call(this,"open")}},{key:"onData",value:function(e){var t=N(e,this.socket.binaryType);this.onPacket(t)}},{key:"onPacket",value:function(e){p(s(i.prototype),"emitReserved",this).call(this,"packet",e)}},{key:"onClose",value:function(e){this.readyState="closed",p(s(i.prototype),"emitReserved",this).call(this,"close",e)}},{key:"pause",value:function(e){}},{key:"createUri",value:function(e){var t=arguments.length>1&&void 0!==arguments[1]?arguments[1]:{};return e+"://"+this._hostname()+this._port()+this.opts.path+this._query(t)}},{key:"_hostname",value:function(){var e=this.opts.hostname;return-1===e.indexOf(":")?e:"["+e+"]"}},{key:"_port",value:function(){return this.opts.port&&(this.opts.secure&&Number(443!==this.opts.port)||!this.opts.secure&&80!==Number(this.opts.port))?":"+this.opts.port:""}},{key:"_query",value:function(e){var t=function(e){var t="";for(var n in e)e.hasOwnProperty(n)&&(t.length&&(t+="&"),t+=encodeURIComponent(n)+"="+encodeURIComponent(e[n]));return t}(e);return t.length?"?"+t:""}}]),i}(U),z="0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-_".split(""),J=64,$={},Q=0,X=0;function G(e){var t="";do{t=z[e%J]+t,e=Math.floor(e/J)}while(e>0);return t}function Z(){var e=G(+new Date);return e!==K?(Q=0,K=e):e+"."+G(Q++)}for(;X<J;X++)$[z[X]]=X;var ee=!1;try{ee="undefined"!=typeof XMLHttpRequest&&"withCredentials"in new XMLHttpRequest}catch(e){}var te=ee;function ne(e){var t=e.xdomain;try{if("undefined"!=typeof XMLHttpRequest&&(!t||te))return new XMLHttpRequest}catch(e){}if(!t)try{return new(I[["Active"].concat("Object").join("X")])("Microsoft.XMLHTTP")}catch(e){}}function re(){}var ie=null!=new ne({xdomain:!1}).responseType,oe=function(e){o(s,e);var n=l(s);function s(e){var r;if(t(this,s),(r=n.call(this,e)).polling=!1,"undefined"!=typeof location){var i="https:"===location.protocol,o=location.port;o||(o=i?"443":"80"),r.xd="undefined"!=typeof location&&e.hostname!==location.hostname||o!==e.port}var a=e&&e.forceBase64;return r.supportsBinary=ie&&!a,r.opts.withCredentials&&(r.cookieJar=void 0),r}return r(s,[{key:"name",get:function(){return"polling"}},{key:"doOpen",value:function(){this.poll()}},{key:"pause",value:function(e){var t=this;this.readyState="pausing";var n=function(){t.readyState="paused",e()};if(this.polling||!this.writable){var r=0;this.polling&&(r++,this.once("pollComplete",(function(){--r||n()}))),this.writable||(r++,this.once("drain",(function(){--r||n()})))}else n()}},{key:"poll",value:function(){this.polling=!0,this.doPoll(),this.emitReserved("poll")}},{key:"onData",value:function(e){var t=this;(function(e,t){for(var n=e.split(P),r=[],i=0;i<n.length;i++){var o=N(n[i],t);if(r.push(o),"error"===o.type)break}return r})(e,this.socket.binaryType).forEach((function(e){if("opening"===t.readyState&&"open"===e.type&&t.onOpen(),"close"===e.type)return t.onClose({description:"transport closed by the server"}),!1;t.onPacket(e)})),"closed"!==this.readyState&&(this.polling=!1,this.emitReserved("pollComplete"),"open"===this.readyState&&this.poll())}},{key:"doClose",value:function(){var e=this,t=function(){e.write([{type:"close"}])};"open"===this.readyState?t():this.once("open",t)}},{key:"write",value:function(e){var t=this;this.writable=!1,function(e,t){var n=e.length,r=new Array(n),i=0;e.forEach((function(e,o){E(e,!1,(function(e){r[o]=e,++i===n&&t(r.join(P))}))}))}(e,(function(e){t.doWrite(e,(function(){t.writable=!0,t.emitReserved("drain")}))}))}},{key:"uri",value:function(){var e=this.opts.secure?"https":"http",t=this.query||{};return!1!==this.opts.timestampRequests&&(t[this.opts.timestampParam]=Z()),this.supportsBinary||t.sid||(t.b64=1),this.createUri(e,t)}},{key:"request",value:function(){var e=arguments.length>0&&void 0!==arguments[0]?arguments[0]:{};return i(e,{xd:this.xd,cookieJar:this.cookieJar},this.opts),new se(this.uri(),e)}},{key:"doWrite",value:function(e,t){var n=this,r=this.request({method:"POST",data:e});r.on("success",t),r.on("error",(function(e,t){n.onError("xhr post error",e,t)}))}},{key:"doPoll",value:function(){var e=this,t=this.request();t.on("data",this.onData.bind(this)),t.on("error",(function(t,n){e.onError("xhr poll error",t,n)})),this.pollXhr=t}}]),s}(W),se=function(e){o(i,e);var n=l(i);function i(e,r){var o;return t(this,i),H(f(o=n.call(this)),r),o.opts=r,o.method=r.method||"GET",o.uri=e,o.data=void 0!==r.data?r.data:null,o.create(),o}return r(i,[{key:"create",value:function(){var e,t=this,n=F(this.opts,"agent","pfx","key","passphrase","cert","ca","ciphers","rejectUnauthorized","autoUnref");n.xdomain=!!this.opts.xd;var r=this.xhr=new ne(n);try{r.open(this.method,this.uri,!0);try{if(this.opts.extraHeaders)for(var o in r.setDisableHeaderCheck&&r.setDisableHeaderCheck(!0),this.opts.extraHeaders)this.opts.extraHeaders.hasOwnProperty(o)&&r.setRequestHeader(o,this.opts.extraHeaders[o])}catch(e){}if("POST"===this.method)try{r.setRequestHeader("Content-type","text/plain;charset=UTF-8")}catch(e){}try{r.setRequestHeader("Accept","*/*")}catch(e){}null===(e=this.opts.cookieJar)||void 0===e||e.addCookies(r),"withCredentials"in r&&(r.withCredentials=this.opts.withCredentials),this.opts.requestTimeout&&(r.timeout=this.opts.requestTimeout),r.onreadystatechange=function(){var e;3===r.readyState&&(null===(e=t.opts.cookieJar)||void 0===e||e.parseCookies(r)),4===r.readyState&&(200===r.status||1223===r.status?t.onLoad():t.setTimeoutFn((function(){t.onError("number"==typeof r.status?r.status:0)}),0))},r.send(this.data)}catch(e){return void this.setTimeoutFn((function(){t.onError(e)}),0)}"undefined"!=typeof document&&(this.index=i.requestsCount++,i.requests[this.index]=this)}},{key:"onError",value:function(e){this.emitReserved("error",e,this.xhr),this.cleanup(!0)}},{key:"cleanup",value:function(e){if(void 0!==this.xhr&&null!==this.xhr){if(this.xhr.onreadystatechange=re,e)try{this.xhr.abort()}catch(e){}"undefined"!=typeof document&&delete i.requests[this.index],this.xhr=null}}},{key:"onLoad",value:function(){var e=this.xhr.responseText;null!==e&&(this.emitReserved("data",e),this.emitReserved("success"),this.cleanup())}},{key:"abort",value:function(){this.cleanup()}}]),i}(U);if(se.requestsCount=0,se.requests={},"undefined"!=typeof document)if("function"==typeof attachEvent)attachEvent("onunload",ae);else if("function"==typeof addEventListener){addEventListener("onpagehide"in I?"pagehide":"unload",ae,!1)}function ae(){for(var e in se.requests)se.requests.hasOwnProperty(e)&&se.requests[e].abort()}var ce="function"==typeof Promise&&"function"==typeof Promise.resolve?function(e){return Promise.resolve().then(e)}:function(e,t){return t(e,0)},ue=I.WebSocket||I.MozWebSocket,he="undefined"!=typeof navigator&&"string"==typeof navigator.product&&"reactnative"===navigator.product.toLowerCase(),fe=function(e){o(i,e);var n=l(i);function i(e){var r;return t(this,i),(r=n.call(this,e)).supportsBinary=!e.forceBase64,r}return r(i,[{key:"name",get:function(){return"websocket"}},{key:"doOpen",value:function(){if(this.check()){var e=this.uri(),t=this.opts.protocols,n=he?{}:F(this.opts,"agent","perMessageDeflate","pfx","key","passphrase","cert","ca","ciphers","rejectUnauthorized","localAddress","protocolVersion","origin","maxPayload","family","checkServerIdentity");this.opts.extraHeaders&&(n.headers=this.opts.extraHeaders);try{this.ws=he?new ue(e,t,n):t?new ue(e,t):new ue(e)}catch(e){return this.emitReserved("error",e)}this.ws.binaryType=this.socket.binaryType,this.addEventListeners()}}},{key:"addEventListeners",value:function(){var e=this;this.ws.onopen=function(){e.opts.autoUnref&&e.ws._socket.unref(),e.onOpen()},this.ws.onclose=function(t){return e.onClose({description:"websocket connection closed",context:t})},this.ws.onmessage=function(t){return e.onData(t.data)},this.ws.onerror=function(t){return e.onError("websocket error",t)}}},{key:"write",value:function(e){var t=this;this.writable=!1;for(var n=function(){var n=e[r],i=r===e.length-1;E(n,t.supportsBinary,(function(e){try{t.ws.send(e)}catch(e){}i&&ce((function(){t.writable=!0,t.emitReserved("drain")}),t.setTimeoutFn)}))},r=0;r<e.length;r++)n()}},{key:"doClose",value:function(){void 0!==this.ws&&(this.ws.close(),this.ws=null)}},{key:"uri",value:function(){var e=this.opts.secure?"wss":"ws",t=this.query||{};return this.opts.timestampRequests&&(t[this.opts.timestampParam]=Z()),this.supportsBinary||(t.b64=1),this.createUri(e,t)}},{key:"check",value:function(){return!!ue}}]),i}(W),le=function(e){o(i,e);var n=l(i);function i(){return t(this,i),n.apply(this,arguments)}return r(i,[{key:"name",get:function(){return"webtransport"}},{key:"doOpen",value:function(){var e=this;"function"==typeof WebTransport&&(this.transport=new WebTransport(this.createUri("https"),this.opts.transportOptions[this.name]),this.transport.closed.then((function(){e.onClose()})).catch((function(t){e.onError("webtransport error",t)})),this.transport.ready.then((function(){e.transport.createBidirectionalStream().then((function(t){var n=function(e,t){B||(B=new TextDecoder);var n=[],r=0,i=-1,o=!1;return new TransformStream({transform:function(s,a){for(n.push(s);;){if(0===r){if(q(n)<1)break;var c=D(n,1);o=128==(128&c[0]),i=127&c[0],r=i<126?3:126===i?1:2}else if(1===r){if(q(n)<2)break;var u=D(n,2);i=new DataView(u.buffer,u.byteOffset,u.length).getUint16(0),r=3}else if(2===r){if(q(n)<8)break;var h=D(n,8),f=new DataView(h.buffer,h.byteOffset,h.length),l=f.getUint32(0);if(l>Math.pow(2,21)-1){a.enqueue(b);break}i=l*Math.pow(2,32)+f.getUint32(4),r=3}else{if(q(n)<i)break;var p=D(n,i);a.enqueue(N(o?p:B.decode(p),t)),r=0}if(0===i||i>e){a.enqueue(b);break}}}})}(Number.MAX_SAFE_INTEGER,e.socket.binaryType),r=t.readable.pipeThrough(n).getReader(),i=j();i.readable.pipeTo(t.writable),e.writer=i.writable.getWriter();!function t(){r.read().then((function(n){var r=n.done,i=n.value;r||(e.onPacket(i),t())})).catch((function(e){}))}();var o={type:"open"};e.query.sid&&(o.data='{"sid":"'.concat(e.query.sid,'"}')),e.writer.write(o).then((function(){return e.onOpen()}))}))})))}},{key:"write",value:function(e){var t=this;this.writable=!1;for(var n=function(){var n=e[r],i=r===e.length-1;t.writer.write(n).then((function(){i&&ce((function(){t.writable=!0,t.emitReserved("drain")}),t.setTimeoutFn)}))},r=0;r<e.length;r++)n()}},{key:"doClose",value:function(){var e;null===(e=this.transport)||void 0===e||e.close()}}]),i}(W),pe={websocket:fe,webtransport:le,polling:oe},de=/^(?:(?![^:@\/?#]+:[^:@\/]*@)(http|https|ws|wss):\/\/)?((?:(([^:@\/?#]*)(?::([^:@\/?#]*))?)?@)?((?:[a-f0-9]{0,4}:){2,7}[a-f0-9]{0,4}|[^:\/?#]*)(?::(\d*))?)(((\/(?:[^?#](?![^?#\/]*\.[^?#\/.]+(?:[?#]|$)))*\/?)?([^?#\/]*))(?:\?([^#]*))?(?:#(.*))?)/,ye=["source","protocol","authority","userInfo","user","password","host","port","relative","path","directory","file","query","anchor"];function ve(e){var t=e,n=e.indexOf("["),r=e.indexOf("]");-1!=n&&-1!=r&&(e=e.substring(0,n)+e.substring(n,r).replace(/:/g,";")+e.substring(r,e.length));for(var i,o,s=de.exec(e||""),a={},c=14;c--;)a[ye[c]]=s[c]||"";return-1!=n&&-1!=r&&(a.source=t,a.host=a.host.substring(1,a.host.length-1).replace(/;/g,":"),a.authority=a.authority.replace("[","").replace("]","").replace(/;/g,":"),a.ipv6uri=!0),a.pathNames=function(e,t){var n=/\/{2,9}/g,r=t.replace(n,"/").split("/");"/"!=t.slice(0,1)&&0!==t.length||r.splice(0,1);"/"==t.slice(-1)&&r.splice(r.length-1,1);return r}(0,a.path),a.queryKey=(i=a.query,o={},i.replace(/(?:^|&)([^&=]*)=?([^&]*)/g,(function(e,t,n){t&&(o[t]=n)})),o),a}var ge=function(n){o(a,n);var s=l(a);function a(n){var r,o=arguments.length>1&&void 0!==arguments[1]?arguments[1]:{};return t(this,a),(r=s.call(this)).binaryType="arraybuffer",r.writeBuffer=[],n&&"object"===e(n)&&(o=n,n=null),n?(n=ve(n),o.hostname=n.host,o.secure="https"===n.protocol||"wss"===n.protocol,o.port=n.port,n.query&&(o.query=n.query)):o.host&&(o.hostname=ve(o.host).host),H(f(r),o),r.secure=null!=o.secure?o.secure:"undefined"!=typeof location&&"https:"===location.protocol,o.hostname&&!o.port&&(o.port=r.secure?"443":"80"),r.hostname=o.hostname||("undefined"!=typeof location?location.hostname:"localhost"),r.port=o.port||("undefined"!=typeof location&&location.port?location.port:r.secure?"443":"80"),r.transports=o.transports||["polling","websocket","webtransport"],r.writeBuffer=[],r.prevBufferLen=0,r.opts=i({path:"/engine.io",agent:!1,withCredentials:!1,upgrade:!0,timestampParam:"t",rememberUpgrade:!1,addTrailingSlash:!0,rejectUnauthorized:!0,perMessageDeflate:{threshold:1024},transportOptions:{},closeOnBeforeunload:!1},o),r.opts.path=r.opts.path.replace(/\/$/,"")+(r.opts.addTrailingSlash?"/":""),"string"==typeof r.opts.query&&(r.opts.query=function(e){for(var t={},n=e.split("&"),r=0,i=n.length;r<i;r++){var o=n[r].split("=");t[decodeURIComponent(o[0])]=decodeURIComponent(o[1])}return t}(r.opts.query)),r.id=null,r.upgrades=null,r.pingInterval=null,r.pingTimeout=null,r.pingTimeoutTimer=null,"function"==typeof addEventListener&&(r.opts.closeOnBeforeunload&&(r.beforeunloadEventListener=function(){r.transport&&(r.transport.removeAllListeners(),r.transport.close())},addEventListener("beforeunload",r.beforeunloadEventListener,!1)),"localhost"!==r.hostname&&(r.offlineEventListener=function(){r.onClose("transport close",{description:"network connection lost"})},addEventListener("offline",r.offlineEventListener,!1))),r.open(),r}return r(a,[{key:"createTransport",value:function(e){var t=i({},this.opts.query);t.EIO=4,t.transport=e,this.id&&(t.sid=this.id);var n=i({},this.opts,{query:t,socket:this,hostname:this.hostname,secure:this.secure,port:this.port},this.opts.transportOptions[e]);return new pe[e](n)}},{key:"open",value:function(){var e,t=this;if(this.opts.rememberUpgrade&&a.priorWebsocketSuccess&&-1!==this.transports.indexOf("websocket"))e="websocket";else{if(0===this.transports.length)return void this.setTimeoutFn((function(){t.emitReserved("error","No transports available")}),0);e=this.transports[0]}this.readyState="opening";try{e=this.createTransport(e)}catch(e){return this.transports.shift(),void this.open()}e.open(),this.setTransport(e)}},{key:"setTransport",value:function(e){var t=this;this.transport&&this.transport.removeAllListeners(),this.transport=e,e.on("drain",this.onDrain.bind(this)).on("packet",this.onPacket.bind(this)).on("error",this.onError.bind(this)).on("close",(function(e){return t.onClose("transport close",e)}))}},{key:"probe",value:function(e){var t=this,n=this.createTransport(e),r=!1;a.priorWebsocketSuccess=!1;var i=function(){r||(n.send([{type:"ping",data:"probe"}]),n.once("packet",(function(e){if(!r)if("pong"===e.type&&"probe"===e.data){if(t.upgrading=!0,t.emitReserved("upgrading",n),!n)return;a.priorWebsocketSuccess="websocket"===n.name,t.transport.pause((function(){r||"closed"!==t.readyState&&(f(),t.setTransport(n),n.send([{type:"upgrade"}]),t.emitReserved("upgrade",n),n=null,t.upgrading=!1,t.flush())}))}else{var i=new Error("probe error");i.transport=n.name,t.emitReserved("upgradeError",i)}})))};function o(){r||(r=!0,f(),n.close(),n=null)}var s=function(e){var r=new Error("probe error: "+e);r.transport=n.name,o(),t.emitReserved("upgradeError",r)};function c(){s("transport closed")}function u(){s("socket closed")}function h(e){n&&e.name!==n.name&&o()}var f=function(){n.removeListener("open",i),n.removeListener("error",s),n.removeListener("close",c),t.off("close",u),t.off("upgrading",h)};n.once("open",i),n.once("error",s),n.once("close",c),this.once("close",u),this.once("upgrading",h),-1!==this.upgrades.indexOf("webtransport")&&"webtransport"!==e?this.setTimeoutFn((function(){r||n.open()}),200):n.open()}},{key:"onOpen",value:function(){if(this.readyState="open",a.priorWebsocketSuccess="websocket"===this.transport.name,this.emitReserved("open"),this.flush(),"open"===this.readyState&&this.opts.upgrade)for(var e=0,t=this.upgrades.length;e<t;e++)this.probe(this.upgrades[e])}},{key:"onPacket",value:function(e){if("opening"===this.readyState||"open"===this.readyState||"closing"===this.readyState)switch(this.emitReserved("packet",e),this.emitReserved("heartbeat"),this.resetPingTimeout(),e.type){case"open":this.onHandshake(JSON.parse(e.data));break;case"ping":this.sendPacket("pong"),this.emitReserved("ping"),this.emitReserved("pong");break;case"error":var t=new Error("server error");t.code=e.data,this.onError(t);break;case"message":this.emitReserved("data",e.data),this.emitReserved("message",e.data)}}},{key:"onHandshake",value:function(e){this.emitReserved("handshake",e),this.id=e.sid,this.transport.query.sid=e.sid,this.upgrades=this.filterUpgrades(e.upgrades),this.pingInterval=e.pingInterval,this.pingTimeout=e.pingTimeout,this.maxPayload=e.maxPayload,this.onOpen(),"closed"!==this.readyState&&this.resetPingTimeout()}},{key:"resetPingTimeout",value:function(){var e=this;this.clearTimeoutFn(this.pingTimeoutTimer),this.pingTimeoutTimer=this.setTimeoutFn((function(){e.onClose("ping timeout")}),this.pingInterval+this.pingTimeout),this.opts.autoUnref&&this.pingTimeoutTimer.unref()}},{key:"onDrain",value:function(){this.writeBuffer.splice(0,this.prevBufferLen),this.prevBufferLen=0,0===this.writeBuffer.length?this.emitReserved("drain"):this.flush()}},{key:"flush",value:function(){if("closed"!==this.readyState&&this.transport.writable&&!this.upgrading&&this.writeBuffer.length){var e=this.getWritablePackets();this.transport.send(e),this.prevBufferLen=e.length,this.emitReserved("flush")}}},{key:"getWritablePackets",value:function(){if(!(this.maxPayload&&"polling"===this.transport.name&&this.writeBuffer.length>1))return this.writeBuffer;for(var e,t=1,n=0;n<this.writeBuffer.length;n++){var r=this.writeBuffer[n].data;if(r&&(t+="string"==typeof(e=r)?function(e){for(var t=0,n=0,r=0,i=e.length;r<i;r++)(t=e.charCodeAt(r))<128?n+=1:t<2048?n+=2:t<55296||t>=57344?n+=3:(r++,n+=4);return n}(e):Math.ceil(1.33*(e.byteLength||e.size))),n>0&&t>this.maxPayload)return this.writeBuffer.slice(0,n);t+=2}return this.writeBuffer}},{key:"write",value:function(e,t,n){return this.sendPacket("message",e,t,n),this}},{key:"send",value:function(e,t,n){return this.sendPacket("message",e,t,n),this}},{key:"sendPacket",value:function(e,t,n,r){if("function"==typeof t&&(r=t,t=void 0),"function"==typeof n&&(r=n,n=null),"closing"!==this.readyState&&"closed"!==this.readyState){(n=n||{}).compress=!1!==n.compress;var i={type:e,data:t,options:n};this.emitReserved("packetCreate",i),this.writeBuffer.push(i),r&&this.once("flush",r),this.flush()}}},{key:"close",value:function(){var e=this,t=function(){e.onClose("forced close"),e.transport.close()},n=function n(){e.off("upgrade",n),e.off("upgradeError",n),t()},r=function(){e.once("upgrade",n),e.once("upgradeError",n)};return"opening"!==this.readyState&&"open"!==this.readyState||(this.readyState="closing",this.writeBuffer.length?this.once("drain",(function(){e.upgrading?r():t()})):this.upgrading?r():t()),this}},{key:"onError",value:function(e){a.priorWebsocketSuccess=!1,this.emitReserved("error",e),this.onClose("transport error",e)}},{key:"onClose",value:function(e,t){"opening"!==this.readyState&&"open"!==this.readyState&&"closing"!==this.readyState||(this.clearTimeoutFn(this.pingTimeoutTimer),this.transport.removeAllListeners("close"),this.transport.close(),this.transport.removeAllListeners(),"function"==typeof removeEventListener&&(removeEventListener("beforeunload",this.beforeunloadEventListener,!1),removeEventListener("offline",this.offlineEventListener,!1)),this.readyState="closed",this.id=null,this.emitReserved("close",e,t),this.writeBuffer=[],this.prevBufferLen=0)}},{key:"filterUpgrades",value:function(e){for(var t=[],n=0,r=e.length;n<r;n++)~this.transports.indexOf(e[n])&&t.push(e[n]);return t}}]),a}(U);ge.protocol=4,ge.protocol;var me="function"==typeof ArrayBuffer,be=function(e){return"function"==typeof ArrayBuffer.isView?ArrayBuffer.isView(e):e.buffer instanceof ArrayBuffer},ke=Object.prototype.toString,we="function"==typeof Blob||"undefined"!=typeof Blob&&"[object BlobConstructor]"===ke.call(Blob),_e="function"==typeof File||"undefined"!=typeof File&&"[object FileConstructor]"===ke.call(File);function Ee(e){return me&&(e instanceof ArrayBuffer||be(e))||we&&e instanceof Blob||_e&&e instanceof File}function Ae(t,n){if(!t||"object"!==e(t))return!1;if(Array.isArray(t)){for(var r=0,i=t.length;r<i;r++)if(Ae(t[r]))return!0;return!1}if(Ee(t))return!0;if(t.toJSON&&"function"==typeof t.toJSON&&1===arguments.length)return Ae(t.toJSON(),!0);for(var o in t)if(Object.prototype.hasOwnProperty.call(t,o)&&Ae(t[o]))return!0;return!1}function Oe(e){var t=[],n=e.data,r=e;return r.data=Te(n,t),r.attachments=t.length,{packet:r,buffers:t}}function Te(t,n){if(!t)return t;if(Ee(t)){var r={_placeholder:!0,num:n.length};return n.push(t),r}if(Array.isArray(t)){for(var i=new Array(t.length),o=0;o<t.length;o++)i[o]=Te(t[o],n);return i}if("object"===e(t)&&!(t instanceof Date)){var s={};for(var a in t)Object.prototype.hasOwnProperty.call(t,a)&&(s[a]=Te(t[a],n));return s}return t}function Re(e,t){return e.data=Ce(e.data,t),delete e.attachments,e}function Ce(t,n){if(!t)return t;if(t&&!0===t._placeholder){if("number"==typeof t.num&&t.num>=0&&t.num<n.length)return n[t.num];throw new Error("illegal attachments")}if(Array.isArray(t))for(var r=0;r<t.length;r++)t[r]=Ce(t[r],n);else if("object"===e(t))for(var i in t)Object.prototype.hasOwnProperty.call(t,i)&&(t[i]=Ce(t[i],n));return t}var Be,Se=["connect","connect_error","disconnect","disconnecting","newListener","removeListener"];!function(e){e[e.CONNECT=0]="CONNECT",e[e.DISCONNECT=1]="DISCONNECT",e[e.EVENT=2]="EVENT",e[e.ACK=3]="ACK",e[e.CONNECT_ERROR=4]="CONNECT_ERROR",e[e.BINARY_EVENT=5]="BINARY_EVENT",e[e.BINARY_ACK=6]="BINARY_ACK"}(Be||(Be={}));var Ne=function(){function e(n){t(this,e),this.replacer=n}return r(e,[{key:"encode",value:function(e){return e.type!==Be.EVENT&&e.type!==Be.ACK||!Ae(e)?[this.encodeAsString(e)]:this.encodeAsBinary({type:e.type===Be.EVENT?Be.BINARY_EVENT:Be.BINARY_ACK,nsp:e.nsp,data:e.data,id:e.id})}},{key:"encodeAsString",value:function(e){var t=""+e.type;return e.type!==Be.BINARY_EVENT&&e.type!==Be.BINARY_ACK||(t+=e.attachments+"-"),e.nsp&&"/"!==e.nsp&&(t+=e.nsp+","),null!=e.id&&(t+=e.id),null!=e.data&&(t+=JSON.stringify(e.data,this.replacer)),t}},{key:"encodeAsBinary",value:function(e){var t=Oe(e),n=this.encodeAsString(t.packet),r=t.buffers;return r.unshift(n),r}}]),e}();function Le(e){return"[object Object]"===Object.prototype.toString.call(e)}var xe=function(e){o(i,e);var n=l(i);function i(e){var r;return t(this,i),(r=n.call(this)).reviver=e,r}return r(i,[{key:"add",value:function(e){var t;if("string"==typeof e){if(this.reconstructor)throw new Error("got plaintext data when reconstructing a packet");var n=(t=this.decodeString(e)).type===Be.BINARY_EVENT;n||t.type===Be.BINARY_ACK?(t.type=n?Be.EVENT:Be.ACK,this.reconstructor=new Pe(t),0===t.attachments&&p(s(i.prototype),"emitReserved",this).call(this,"decoded",t)):p(s(i.prototype),"emitReserved",this).call(this,"decoded",t)}else{if(!Ee(e)&&!e.base64)throw new Error("Unknown type: "+e);if(!this.reconstructor)throw new Error("got binary data when not reconstructing a packet");(t=this.reconstructor.takeBinaryData(e))&&(this.reconstructor=null,p(s(i.prototype),"emitReserved",this).call(this,"decoded",t))}}},{key:"decodeString",value:function(e){var t=0,n={type:Number(e.charAt(0))};if(void 0===Be[n.type])throw new Error("unknown packet type "+n.type);if(n.type===Be.BINARY_EVENT||n.type===Be.BINARY_ACK){for(var r=t+1;"-"!==e.charAt(++t)&&t!=e.length;);var o=e.substring(r,t);if(o!=Number(o)||"-"!==e.charAt(t))throw new Error("Illegal attachments");n.attachments=Number(o)}if("/"===e.charAt(t+1)){for(var s=t+1;++t;){if(","===e.charAt(t))break;if(t===e.length)break}n.nsp=e.substring(s,t)}else n.nsp="/";var a=e.charAt(t+1);if(""!==a&&Number(a)==a){for(var c=t+1;++t;){var u=e.charAt(t);if(null==u||Number(u)!=u){--t;break}if(t===e.length)break}n.id=Number(e.substring(c,t+1))}if(e.charAt(++t)){var h=this.tryParse(e.substr(t));if(!i.isPayloadValid(n.type,h))throw new Error("invalid payload");n.data=h}return n}},{key:"tryParse",value:function(e){try{return JSON.parse(e,this.reviver)}catch(e){return!1}}},{key:"destroy",value:function(){this.reconstructor&&(this.reconstructor.finishedReconstruction(),this.reconstructor=null)}}],[{key:"isPayloadValid",value:function(e,t){switch(e){case Be.CONNECT:return Le(t);case Be.DISCONNECT:return void 0===t;case Be.CONNECT_ERROR:return"string"==typeof t||Le(t);case Be.EVENT:case Be.BINARY_EVENT:return Array.isArray(t)&&("number"==typeof t[0]||"string"==typeof t[0]&&-1===Se.indexOf(t[0]));case Be.ACK:case Be.BINARY_ACK:return Array.isArray(t)}}}]),i}(U),Pe=function(){function e(n){t(this,e),this.packet=n,this.buffers=[],this.reconPack=n}return r(e,[{key:"takeBinaryData",value:function(e){if(this.buffers.push(e),this.buffers.length===this.reconPack.attachments){var t=Re(this.reconPack,this.buffers);return this.finishedReconstruction(),t}return null}},{key:"finishedReconstruction",value:function(){this.reconPack=null,this.buffers=[]}}]),e}(),je=Object.freeze({__proto__:null,protocol:5,get PacketType(){return Be},Encoder:Ne,Decoder:xe});function qe(e,t,n){return e.on(t,n),function(){e.off(t,n)}}var De=Object.freeze({connect:1,connect_error:1,disconnect:1,disconnecting:1,newListener:1,removeListener:1}),Ue=function(e){o(a,e);var n=l(a);function a(e,r,o){var s;return t(this,a),(s=n.call(this)).connected=!1,s.recovered=!1,s.receiveBuffer=[],s.sendBuffer=[],s._queue=[],s._queueSeq=0,s.ids=0,s.acks={},s.flags={},s.io=e,s.nsp=r,o&&o.auth&&(s.auth=o.auth),s._opts=i({},o),s.io._autoConnect&&s.open(),s}return r(a,[{key:"disconnected",get:function(){return!this.connected}},{key:"subEvents",value:function(){if(!this.subs){var e=this.io;this.subs=[qe(e,"open",this.onopen.bind(this)),qe(e,"packet",this.onpacket.bind(this)),qe(e,"error",this.onerror.bind(this)),qe(e,"close",this.onclose.bind(this))]}}},{key:"active",get:function(){return!!this.subs}},{key:"connect",value:function(){return this.connected||(this.subEvents(),this.io._reconnecting||this.io.open(),"open"===this.io._readyState&&this.onopen()),this}},{key:"open",value:function(){return this.connect()}},{key:"send",value:function(){for(var e=arguments.length,t=new Array(e),n=0;n<e;n++)t[n]=arguments[n];return t.unshift("message"),this.emit.apply(this,t),this}},{key:"emit",value:function(e){if(De.hasOwnProperty(e))throw new Error('"'+e.toString()+'" is a reserved event name');for(var t=arguments.length,n=new Array(t>1?t-1:0),r=1;r<t;r++)n[r-1]=arguments[r];if(n.unshift(e),this._opts.retries&&!this.flags.fromQueue&&!this.flags.volatile)return this._addToQueue(n),this;var i={type:Be.EVENT,data:n,options:{}};if(i.options.compress=!1!==this.flags.compress,"function"==typeof n[n.length-1]){var o=this.ids++,s=n.pop();this._registerAckCallback(o,s),i.id=o}var a=this.io.engine&&this.io.engine.transport&&this.io.engine.transport.writable;return this.flags.volatile&&(!a||!this.connected)||(this.connected?(this.notifyOutgoingListeners(i),this.packet(i)):this.sendBuffer.push(i)),this.flags={},this}},{key:"_registerAckCallback",value:function(e,t){var n,r=this,i=null!==(n=this.flags.timeout)&&void 0!==n?n:this._opts.ackTimeout;if(void 0!==i){var o=this.io.setTimeoutFn((function(){delete r.acks[e];for(var n=0;n<r.sendBuffer.length;n++)r.sendBuffer[n].id===e&&r.sendBuffer.splice(n,1);t.call(r,new Error("operation has timed out"))}),i),s=function(){r.io.clearTimeoutFn(o);for(var e=arguments.length,n=new Array(e),i=0;i<e;i++)n[i]=arguments[i];t.apply(r,n)};s.withError=!0,this.acks[e]=s}else this.acks[e]=t}},{key:"emitWithAck",value:function(e){for(var t=this,n=arguments.length,r=new Array(n>1?n-1:0),i=1;i<n;i++)r[i-1]=arguments[i];return new Promise((function(n,i){var o=function(e,t){return e?i(e):n(t)};o.withError=!0,r.push(o),t.emit.apply(t,[e].concat(r))}))}},{key:"_addToQueue",value:function(e){var t,n=this;"function"==typeof e[e.length-1]&&(t=e.pop());var r={id:this._queueSeq++,tryCount:0,pending:!1,args:e,flags:i({fromQueue:!0},this.flags)};e.push((function(e){if(r===n._queue[0]){if(null!==e)r.tryCount>n._opts.retries&&(n._queue.shift(),t&&t(e));else if(n._queue.shift(),t){for(var i=arguments.length,o=new Array(i>1?i-1:0),s=1;s<i;s++)o[s-1]=arguments[s];t.apply(void 0,[null].concat(o))}return r.pending=!1,n._drainQueue()}})),this._queue.push(r),this._drainQueue()}},{key:"_drainQueue",value:function(){var e=arguments.length>0&&void 0!==arguments[0]&&arguments[0];if(this.connected&&0!==this._queue.length){var t=this._queue[0];t.pending&&!e||(t.pending=!0,t.tryCount++,this.flags=t.flags,this.emit.apply(this,t.args))}}},{key:"packet",value:function(e){e.nsp=this.nsp,this.io._packet(e)}},{key:"onopen",value:function(){var e=this;"function"==typeof this.auth?this.auth((function(t){e._sendConnectPacket(t)})):this._sendConnectPacket(this.auth)}},{key:"_sendConnectPacket",value:function(e){this.packet({type:Be.CONNECT,data:this._pid?i({pid:this._pid,offset:this._lastOffset},e):e})}},{key:"onerror",value:function(e){this.connected||this.emitReserved("connect_error",e)}},{key:"onclose",value:function(e,t){this.connected=!1,delete this.id,this.emitReserved("disconnect",e,t),this._clearAcks()}},{key:"_clearAcks",value:function(){var e=this;Object.keys(this.acks).forEach((function(t){if(!e.sendBuffer.some((function(e){return String(e.id)===t}))){var n=e.acks[t];delete e.acks[t],n.withError&&n.call(e,new Error("socket has been disconnected"))}}))}},{key:"onpacket",value:function(e){if(e.nsp===this.nsp)switch(e.type){case Be.CONNECT:e.data&&e.data.sid?this.onconnect(e.data.sid,e.data.pid):this.emitReserved("connect_error",new Error("It seems you are trying to reach a Socket.IO server in v2.x with a v3.x client, but they are not compatible (more information here: https://socket.io/docs/v3/migrating-from-2-x-to-3-0/)"));break;case Be.EVENT:case Be.BINARY_EVENT:this.onevent(e);break;case Be.ACK:case Be.BINARY_ACK:this.onack(e);break;case Be.DISCONNECT:this.ondisconnect();break;case Be.CONNECT_ERROR:this.destroy();var t=new Error(e.data.message);t.data=e.data.data,this.emitReserved("connect_error",t)}}},{key:"onevent",value:function(e){var t=e.data||[];null!=e.id&&t.push(this.ack(e.id)),this.connected?this.emitEvent(t):this.receiveBuffer.push(Object.freeze(t))}},{key:"emitEvent",value:function(e){if(this._anyListeners&&this._anyListeners.length){var t,n=y(this._anyListeners.slice());try{for(n.s();!(t=n.n()).done;){t.value.apply(this,e)}}catch(e){n.e(e)}finally{n.f()}}p(s(a.prototype),"emit",this).apply(this,e),this._pid&&e.length&&"string"==typeof e[e.length-1]&&(this._lastOffset=e[e.length-1])}},{key:"ack",value:function(e){var t=this,n=!1;return function(){if(!n){n=!0;for(var r=arguments.length,i=new Array(r),o=0;o<r;o++)i[o]=arguments[o];t.packet({type:Be.ACK,id:e,data:i})}}}},{key:"onack",value:function(e){var t=this.acks[e.id];"function"==typeof t&&(delete this.acks[e.id],t.withError&&e.data.unshift(null),t.apply(this,e.data))}},{key:"onconnect",value:function(e,t){this.id=e,this.recovered=t&&this._pid===t,this._pid=t,this.connected=!0,this.emitBuffered(),this.emitReserved("connect"),this._drainQueue(!0)}},{key:"emitBuffered",value:function(){var e=this;this.receiveBuffer.forEach((function(t){return e.emitEvent(t)})),this.receiveBuffer=[],this.sendBuffer.forEach((function(t){e.notifyOutgoingListeners(t),e.packet(t)})),this.sendBuffer=[]}},{key:"ondisconnect",value:function(){this.destroy(),this.onclose("io server disconnect")}},{key:"destroy",value:function(){this.subs&&(this.subs.forEach((function(e){return e()})),this.subs=void 0),this.io._destroy(this)}},{key:"disconnect",value:function(){return this.connected&&this.packet({type:Be.DISCONNECT}),this.destroy(),this.connected&&this.onclose("io client disconnect"),this}},{key:"close",value:function(){return this.disconnect()}},{key:"compress",value:function(e){return this.flags.compress=e,this}},{key:"volatile",get:function(){return this.flags.volatile=!0,this}},{key:"timeout",value:function(e){return this.flags.timeout=e,this}},{key:"onAny",value:function(e){return this._anyListeners=this._anyListeners||[],this._anyListeners.push(e),this}},{key:"prependAny",value:function(e){return this._anyListeners=this._anyListeners||[],this._anyListeners.unshift(e),this}},{key:"offAny",value:function(e){if(!this._anyListeners)return this;if(e){for(var t=this._anyListeners,n=0;n<t.length;n++)if(e===t[n])return t.splice(n,1),this}else this._anyListeners=[];return this}},{key:"listenersAny",value:function(){return this._anyListeners||[]}},{key:"onAnyOutgoing",value:function(e){return this._anyOutgoingListeners=this._anyOutgoingListeners||[],this._anyOutgoingListeners.push(e),this}},{key:"prependAnyOutgoing",value:function(e){return this._anyOutgoingListeners=this._anyOutgoingListeners||[],this._anyOutgoingListeners.unshift(e),this}},{key:"offAnyOutgoing",value:function(e){if(!this._anyOutgoingListeners)return this;if(e){for(var t=this._anyOutgoingListeners,n=0;n<t.length;n++)if(e===t[n])return t.splice(n,1),this}else this._anyOutgoingListeners=[];return this}},{key:"listenersAnyOutgoing",value:function(){return this._anyOutgoingListeners||[]}},{key:"notifyOutgoingListeners",value:function(e){if(this._anyOutgoingListeners&&this._anyOutgoingListeners.length){var t,n=y(this._anyOutgoingListeners.slice());try{for(n.s();!(t=n.n()).done;){t.value.apply(this,e.data)}}catch(e){n.e(e)}finally{n.f()}}}}]),a}(U);function Ie(e){e=e||{},this.ms=e.min||100,this.max=e.max||1e4,this.factor=e.factor||2,this.jitter=e.jitter>0&&e.jitter<=1?e.jitter:0,this.attempts=0}Ie.prototype.duration=function(){var e=this.ms*Math.pow(this.factor,this.attempts++);if(this.jitter){var t=Math.random(),n=Math.floor(t*this.jitter*e);e=0==(1&Math.floor(10*t))?e-n:e+n}return 0|Math.min(e,this.max)},Ie.prototype.reset=function(){this.attempts=0},Ie.prototype.setMin=function(e){this.ms=e},Ie.prototype.setMax=function(e){this.max=e},Ie.prototype.setJitter=function(e){this.jitter=e};var Fe=function(n){o(s,n);var i=l(s);function s(n,r){var o,a;t(this,s),(o=i.call(this)).nsps={},o.subs=[],n&&"object"===e(n)&&(r=n,n=void 0),(r=r||{}).path=r.path||"/socket.io",o.opts=r,H(f(o),r),o.reconnection(!1!==r.reconnection),o.reconnectionAttempts(r.reconnectionAttempts||1/0),o.reconnectionDelay(r.reconnectionDelay||1e3),o.reconnectionDelayMax(r.reconnectionDelayMax||5e3),o.randomizationFactor(null!==(a=r.randomizationFactor)&&void 0!==a?a:.5),o.backoff=new Ie({min:o.reconnectionDelay(),max:o.reconnectionDelayMax(),jitter:o.randomizationFactor()}),o.timeout(null==r.timeout?2e4:r.timeout),o._readyState="closed",o.uri=n;var c=r.parser||je;return o.encoder=new c.Encoder,o.decoder=new c.Decoder,o._autoConnect=!1!==r.autoConnect,o._autoConnect&&o.open(),o}return r(s,[{key:"reconnection",value:function(e){return arguments.length?(this._reconnection=!!e,this):this._reconnection}},{key:"reconnectionAttempts",value:function(e){return void 0===e?this._reconnectionAttempts:(this._reconnectionAttempts=e,this)}},{key:"reconnectionDelay",value:function(e){var t;return void 0===e?this._reconnectionDelay:(this._reconnectionDelay=e,null===(t=this.backoff)||void 0===t||t.setMin(e),this)}},{key:"randomizationFactor",value:function(e){var t;return void 0===e?this._randomizationFactor:(this._randomizationFactor=e,null===(t=this.backoff)||void 0===t||t.setJitter(e),this)}},{key:"reconnectionDelayMax",value:function(e){var t;return void 0===e?this._reconnectionDelayMax:(this._reconnectionDelayMax=e,null===(t=this.backoff)||void 0===t||t.setMax(e),this)}},{key:"timeout",value:function(e){return arguments.length?(this._timeout=e,this):this._timeout}},{key:"maybeReconnectOnOpen",value:function(){!this._reconnecting&&this._reconnection&&0===this.backoff.attempts&&this.reconnect()}},{key:"open",value:function(e){var t=this;if(~this._readyState.indexOf("open"))return this;this.engine=new ge(this.uri,this.opts);var n=this.engine,r=this;this._readyState="opening",this.skipReconnect=!1;var i=qe(n,"open",(function(){r.onopen(),e&&e()})),o=function(n){t.cleanup(),t._readyState="closed",t.emitReserved("error",n),e?e(n):t.maybeReconnectOnOpen()},s=qe(n,"error",o);if(!1!==this._timeout){var a=this._timeout,c=this.setTimeoutFn((function(){i(),o(new Error("timeout")),n.close()}),a);this.opts.autoUnref&&c.unref(),this.subs.push((function(){t.clearTimeoutFn(c)}))}return this.subs.push(i),this.subs.push(s),this}},{key:"connect",value:function(e){return this.open(e)}},{key:"onopen",value:function(){this.cleanup(),this._readyState="open",this.emitReserved("open");var e=this.engine;this.subs.push(qe(e,"ping",this.onping.bind(this)),qe(e,"data",this.ondata.bind(this)),qe(e,"error",this.onerror.bind(this)),qe(e,"close",this.onclose.bind(this)),qe(this.decoder,"decoded",this.ondecoded.bind(this)))}},{key:"onping",value:function(){this.emitReserved("ping")}},{key:"ondata",value:function(e){try{this.decoder.add(e)}catch(e){this.onclose("parse error",e)}}},{key:"ondecoded",value:function(e){var t=this;ce((function(){t.emitReserved("packet",e)}),this.setTimeoutFn)}},{key:"onerror",value:function(e){this.emitReserved("error",e)}},{key:"socket",value:function(e,t){var n=this.nsps[e];return n?this._autoConnect&&!n.active&&n.connect():(n=new Ue(this,e,t),this.nsps[e]=n),n}},{key:"_destroy",value:function(e){for(var t=0,n=Object.keys(this.nsps);t<n.length;t++){var r=n[t];if(this.nsps[r].active)return}this._close()}},{key:"_packet",value:function(e){for(var t=this.encoder.encode(e),n=0;n<t.length;n++)this.engine.write(t[n],e.options)}},{key:"cleanup",value:function(){this.subs.forEach((function(e){return e()})),this.subs.length=0,this.decoder.destroy()}},{key:"_close",value:function(){this.skipReconnect=!0,this._reconnecting=!1,this.onclose("forced close"),this.engine&&this.engine.close()}},{key:"disconnect",value:function(){return this._close()}},{key:"onclose",value:function(e,t){this.cleanup(),this.backoff.reset(),this._readyState="closed",this.emitReserved("close",e,t),this._reconnection&&!this.skipReconnect&&this.reconnect()}},{key:"reconnect",value:function(){var e=this;if(this._reconnecting||this.skipReconnect)return this;var t=this;if(this.backoff.attempts>=this._reconnectionAttempts)this.backoff.reset(),this.emitReserved("reconnect_failed"),this._reconnecting=!1;else{var n=this.backoff.duration();this._reconnecting=!0;var r=this.setTimeoutFn((function(){t.skipReconnect||(e.emitReserved("reconnect_attempt",t.backoff.attempts),t.skipReconnect||t.open((function(n){n?(t._reconnecting=!1,t.reconnect(),e.emitReserved("reconnect_error",n)):t.onreconnect()})))}),n);this.opts.autoUnref&&r.unref(),this.subs.push((function(){e.clearTimeoutFn(r)}))}}},{key:"onreconnect",value:function(){var e=this.backoff.attempts;this._reconnecting=!1,this.backoff.reset(),this.emitReserved("reconnect",e)}}]),s}(U),Me={};function Ve(t,n){"object"===e(t)&&(n=t,t=void 0);var r,i=function(e){var t=arguments.length>1&&void 0!==arguments[1]?arguments[1]:"",n=arguments.length>2?arguments[2]:void 0,r=e;n=n||"undefined"!=typeof location&&location,null==e&&(e=n.protocol+"//"+n.host),"string"==typeof e&&("/"===e.charAt(0)&&(e="/"===e.charAt(1)?n.protocol+e:n.host+e),/^(https?|wss?):\/\//.test(e)||(e=void 0!==n?n.protocol+"//"+e:"https://"+e),r=ve(e)),r.port||(/^(http|ws)$/.test(r.protocol)?r.port="80":/^(http|ws)s$/.test(r.protocol)&&(r.port="443")),r.path=r.path||"/";var i=-1!==r.host.indexOf(":")?"["+r.host+"]":r.host;return r.id=r.protocol+"://"+i+":"+r.port+t,r.href=r.protocol+"://"+i+(n&&n.port===r.port?"":":"+r.port),r}(t,(n=n||{}).path||"/socket.io"),o=i.source,s=i.id,a=i.path,c=Me[s]&&a in Me[s].nsps;return n.forceNew||n["force new connection"]||!1===n.multiplex||c?r=new Fe(o,n):(Me[s]||(Me[s]=new Fe(o,n)),r=Me[s]),i.query&&!n.query&&(n.query=i.queryKey),r.socket(i.path,n)}return i(Ve,{Manager:Fe,Socket:Ue,io:Ve,connect:Ve}),Ve}));
  
  
  },{}],4:[function(require,module,exports){
  io = require('socket.io-client/dist/socket.io.min.js');
  var pipeMobileRecorder = require('./mobile.js');
  var pipeDesktopUploader = require('./d_upload.js');
  var pipeRTCRecorder = require('./rtc.js');
  const PipeQuery = require('./pipeQuery.js');
  
  PipeSDK = {
  
    recorders: {},
  
    insert: function (pipeElement, pipeVars, callback) {
  
      // Define the global PipeQuery instance (pq)
      if (!window.pq) {
        pq = new PipeQuery();
      }
  
      /**
       * Returns a Promise that resolves when the DOM content is fully loaded.
       * If the DOM content is already loaded, the Promise resolves immediately.
       * If the DOM content is not yet loaded, the Promise resolves when the DOM state changes to complete or interactive.
       * @returns {Promise<void>} - A Promise that resolves when the DOM content is fully loaded and the piperecorder tag exists.
       */
      function domContentLoaded() {
        if (document.readyState === 'complete' || !!document.getElementById(pipeElement)) {
          return Promise.resolve();
        } else {
          return new Promise((resolve, reject) => {
            document.addEventListener("readystatechange", () => {
              if (document.readyState === "complete" || document.readyState === "interactive") {
                !!document.getElementById(pipeElement) && resolve();
              }
  
              // Reject if no piperecorder div tag is present when the DOM is fully loaded
              if (document.readyState === "complete" && !document.getElementById(pipeElement)) {
                reject();
              }
            });
          });
        }
      }
  
      // Build slug and date - value is set in build script -
      const PIPE_BUILD_SLUG = '79f2b223e';
      const PIPE_BUILD_DATE = '02-04-2024';
      console.log("pipe-log at " + new Date().toISOString() + ": Build: " + PIPE_BUILD_SLUG + " Build date: " + PIPE_BUILD_DATE);
      pipeVars["build"] = PIPE_BUILD_SLUG;
      pipeVars["buildDate"] = PIPE_BUILD_DATE;
  
      //maintenance mode flag
      maintenance = 0;
  
      //client vars
      var webRtcClient = false;
      var isSecureContext = false;
  
      //inline recorder
      var mediarec_mobile = 0;
      var mediarec_ios = 0;
      var mediarec_mac = 0;
  
      camPerm = "";
      micPerm = "";
  
      //region conf
      html5Server = "";
      html5FallbackServer = "";
      storageS3Location = "";
      storageS3FallbackLocation = "";
      region = "";
  
      //lang vars
      langCode = "en";
  
      //trim the environmentId in case it starts or ends with spaces or other whitespace characters
      //eid can be an integer or a 6 characters string; details @ https://changelog.addpipe.com/alphanumeric-environment-ids-115627
      pipeVars["eid"] = String(pipeVars["eid"] ? pipeVars["eid"] : '1').trim();
  
      //trim the accountHash in case it starts or ends with spaces or other whitespace characters
      pipeVars["accountHash"] = String(pipeVars["accountHash"]).trim();
  
      //flag used for knowing when to set the timeslice param to 10 to fix issue on Safari on certain macOS versions
      isSafariOnMac = false;
  
      function get_browser() {
        var ua = navigator.userAgent,
            tem,
            M = ua.match(/(opera|chrome|safari|firefox|msie|trident(?=\/))\/?\s*(\d+)/i) || [];
        if (/trident/i.test(M[1])) {
          tem = /\brv[ :]+(\d+)/g.exec(ua) || [];
          return { name: 'IE', version: tem[1] || '' };
        }
        if (M[1] === 'Chrome') {
          tem = ua.match(/\bOPR|Edge\/(\d+)/);
          if (tem != null) {
            return { name: 'Opera', version: tem[1] };
          }
        }
        M = M[2] ? [M[1], M[2]] : [navigator.appName, navigator.appVersion, '-?'];
        if ((tem = ua.match(/version\/(\d+)/i)) != null) {
          M.splice(1, 1, tem[1]);
        }
        return {
          name: M[0],
          version: M[1]
        };
      }
  
      // Set default value to mrt if it's value is missing or is NaN
      if (!Number.isSafeInteger(parseInt(pipeVars["mrt"])) || parseInt(pipeVars["mrt"]) === 0) {
        pipeVars["mrt"] = 600;
      }
  
      // Set the recorder unique ID
      function generateUniqueID(length = 32) {
        const validChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let array = new Uint8Array(length);
        window.crypto.getRandomValues(array);
        array = array.map(x => validChars.charCodeAt(x % validChars.length));
        const randomState = String.fromCharCode.apply(null, array);
        //console.log(randomState);
        return randomState;
      }
      // Generate 20 characters length unique ID for the recorder
      pipeVars["recorderId"] = generateUniqueID(20);
  
      // Precheck check
      // URL with query parameters
      const url = `https://cdn.addpipe.com/2.0/precheck.php?accountHash=${encodeURIComponent(pipeVars["accountHash"])}&environmentId=${encodeURIComponent(pipeVars["eid"] || '1')}&embedCode=2&build=${encodeURIComponent(PIPE_BUILD_SLUG)}`;
  
      // Wait for the DOM content to be fully loaded (used for JS embedded code in order to have the same behavior as the HTML embedded code)
      // This prevents errors from misplaced scripts (<script> before DOM)
      domContentLoaded().then(() => {
  
        pq.ajax({
          url: url,
          success: function (data) {
            closedAccount = data.closedAccount;
            if (data.error !== undefined) {
              precheckError = data.error;
            }
  
            showPoweredBy = data.showPoweredBy;
            prefLang = data.lang;
            accType = data.accType;
  
            //set inline recorder flags if they exists, otherwise they will default to 0
            if (data.mediarec_mobile !== undefined) {
              mediarec_mobile = data.mediarec_mobile;
            }
  
            if (data.mediarec_ios !== undefined) {
              mediarec_ios = data.mediarec_ios;
            }
  
            if (data.mediarec_mac !== undefined) {
              mediarec_mac = data.mediarec_mac;
            }
            //###############################        
  
            //set the maintenance value if it exists, otherwise it will default to 0
            if (data.maintenance !== undefined) {
              maintenance = data.maintenance;
            }
  
            //region conf
            html5Server = data.html5Server;
            storageS3Location = data.s3Location;
            region = data.region;
  
            if (data.region == "us1" || data.region == "us2") {
              html5FallbackServer = data.html5Server_fallback;
              storageS3FallbackLocation = data.s3Location_fallback;
            }
  
            // Get recording size limit (recordingSizeLimit)
            pipeVars["recordingSizeLimit"] = data.recordingSizeLimit || 5368709120; // Default is 5GiB in bytes
  
            // Check the Feature policy
            if ("featurePolicy" in document) {
              const checkFeaturePolicy = (feature, accessType) => {
                const allowed = document.featurePolicy.allowsFeature(feature);
                const message = allowed ? "allows" : "does not allow";
                console.log(`pipe-log at ${new Date().toISOString()} page feature policy ${message} ${accessType}`);
              };
              checkFeaturePolicy('camera', 'camera access');
              checkFeaturePolicy('microphone', 'microphone access');
            }
  
            const ua = navigator.userAgent.toLowerCase();
            // Whether it is a mobile device or not
            let mobile = ua.indexOf("ipad") != -1 || ua.indexOf("iphone") != -1 || ua.indexOf("android") != -1 || ua.indexOf("ipod") != -1 || ua.indexOf("windows ce") != -1 || ua.indexOf("windows phone") != -1 || ua.indexOf("mac") != -1 && navigator.maxTouchPoints > 1;
  
            // Whether the context is secure
            isSecureContext = document.location.protocol.includes("https") || window.location.protocol === "http:" && ["localhost", "127.0.0.1", "::1"].includes(window.location.hostname);
  
            // WebRTC compatibility
            webRtcClient = isSecureContext && ("getUserMedia" in navigator || "mediaDevices" in navigator && "getUserMedia" in navigator.mediaDevices) && typeof MediaRecorder === "function" && typeof MediaRecorder.isTypeSupported === "function" && "readyState" in MediaStreamTrack.prototype;
  
            // Check inline desktop recorder
            // Android
            if (mediarec_mobile == 1 && ua.includes("android")) mobile = false;
            // IOS
            if (mediarec_ios == 1 && (ua.indexOf("iphone") != -1 || ua.indexOf("mac") != -1 && navigator.maxTouchPoints > 1)) mobile = false;
  
            // Check for Safari on MacOS
            if (ua.includes("mac") && navigator.maxTouchPoints == 0) {
              if (get_browser().name == "Safari") {
                isSafariOnMac = true;
                if (mediarec_mac == 0) {
                  webRtcClient = false;
                }
              }
            }
  
            if (mobile) {
              PipeSDK.recorders[pipeElement] = new Object();
              PipeSDK.recorders[pipeElement].remove = function () {
                pq.$("#" + pipeElement).html("").css("height", "0px");
                pq.clearCacheById(pipeElement);
              };
  
              pipeHandlers(pipeElement);
              callback(PipeSDK.recorders[pipeElement]);
  
              pipeMobileRecorder.addPipeMobileRecorder(pipeElement, pipeVars);
            } else {
              // Get data from quality profiles - synchronous
              let qualityProfileData = undefined;
              let qualityProfileURL = "https://cdn.addpipe.com/2.0/" + pipeVars["qualityurl"];
              if (pipeVars["qualityurl"].indexOf("http") != -1) {
                qualityProfileURL = pipeVars["qualityurl"];
              }
  
              pq.ajax({
                url: qualityProfileURL,
                async: false,
                dataType: "xml",
                success: res => {
                  qualityProfileData = res;
                },
                error: function (_, status, error) {
                  console.log("pipe-log at " + new Date().toISOString() + " Error occurred while loading quality profile data.", status, error);
  
                  // Check if there is any valid video quality profile or fall back to 360p if not
                  /**
                   * Extracts the video quality profile from a URL
                   * @param {string} url - The url for the video quality profile xml file
                   * @returns {string} - The video quality profile or an empty string
                   */
                  const extractVideoQuality = url => {
                    const match = url.match(/\/(\d+p)\.xml$/);
                    return match ? match[1] : "";
                  };
  
                  /**
                   * Creates an XML document representing a bandwidth item with width, height, and frame rate.
                   * @param {*} width - The width of the video
                   * @param {*} height - The height of the video
                   * @param {*} framerate - The framerate of the video
                   * @returns {Document} The XML document representing the bandwidth item.
                   */
                  const createXmlDocument = (width, height, framerate) => {
                    // Create a new XML document
                    const xmlDoc = document.implementation.createDocument(null, 'bandwidth');
                    const item = xmlDoc.createElement('item');
                    const appendChild = (name, text) => {
                      const element = xmlDoc.createElement(name);
                      element.textContent = text;
                      return element;
                    };
                    item.appendChild(appendChild('w', width));
                    item.appendChild(appendChild('h', height));
                    item.appendChild(appendChild('fps', framerate));
                    xmlDoc.documentElement.appendChild(item);
                    return xmlDoc;
                  };
  
                  /**
                   * Generates the quality profile data as a document
                   * @param {string} [qualityProfile="360p"] - The desired quality profile. Accepted: 240p, 360p, 480p, 720p, 1080p, 1440p, 2160p;
                   * @returns {Document} The video quality profile data
                   */
                  const generateQualityProfileData = (qualityProfile = "360p") => {
                    const profiles = {
                      "2160p": ["3840", "2160"],
                      "1440p": ["2560", "1440"],
                      "1080p": ["1920", "1080"],
                      "720p": ["1280", "720"],
                      "480p": ["640", "480"],
                      "240p": ["320", "240"],
                      "360p": ["640", "360"]
                    };
                    const [width, height] = profiles[qualityProfile] || profiles["360p"];
                    return createXmlDocument(width, height, "30");
                  };
  
                  const fallbackQualityProfile = extractVideoQuality(qualityProfileURL) || "360p";
                  qualityProfileData = generateQualityProfileData(fallbackQualityProfile);
                  console.log("pipe-log at " + new Date().toISOString() + " Using default values for the following quality profile:", fallbackQualityProfile);
                }
              });
  
              //======================== Init screen vars=======================
              recordTxt = "Record Video";
              uploadRecTxt = "Upload Video";
              uploadingTxt = "Uploading";
              unsupportedTxt = "Unsupported file type!";
              maxFileSizeTxt = "Maximum allowed file size is";
              upgradeTxt = "Please upgrade your browser! Your current one lacks the features needed to record & submit videos.";
              uploadFailedTxt = "Upload failed!";
              doneTxt = "Done!";
              uploadOrRecordAnotherTxt = "Record or upload another one";
              recordScreenTxt = "Record Screen";
              selectScreenTxt = "Select screen for capture";
              installExtensionTxt = "To record the screen you need to install the";
              screenPermissionTxt = "Permission was denied. Could not get screen stream";
              recBtnTxt = "record";
              stopBtnTxt = "stop";
              playBtnTxt = "play";
              pauseBtnTxt = "pause";
              saveBtnTxt = "Save";
              connectingTxt = "Connecting...";
              bufferingTxt = "Buffering...";
              uploadingTxt = "Uploading...";
              savingTxt = "Saving...";
              savedTxt = "Saved";
              blockedTxt = "You blocked camera and microphone access. Unblock from the address bar to try again";
              withSysAudioTxt = "(with system audio)";
              if (pipeVars["ao"] == 1) {
                blockedTxt = "You blocked microphone access. Unblock from the address bar to try again";
              }
              noCameraTxt = "Connect a microphone or camera with microphone to record audio or video";
              noMicTxt = "You do not have a microphone installed";
              allowAccessTxt = "Allow {DOMAIN_NAME} to use your camera and microphone";
              if (pipeVars["ao"] == 1) {
                allowAccessTxt = "Allow {DOMAIN_NAME} to use your microphone";
              }
              allowMicAccessTxt = "Allow {DOMAIN_NAME} to use your microphone";
              micIconTxt = "Microphone used: ";
              camIconTxt = "Camera used: ";
              camUsedTxt = "The camera is already used by another app";
              conInterruptedTxt = "Your connection to the server has been interrupted";
              downloadText = "Download";
              unableToSaveTxt = "Unable to save recording";
  
              //design options
              cornerRadius = "8";
              if (pipeVars["cornerradius"]) {
                cornerRadius = pipeVars["cornerradius"];
              }
  
              bgCol = "#f6f6f6";
              if (pipeVars["bgCol"]) {
                bgCol = pipeVars["bgCol"].replace("0x", "#");
              }
  
              menuCol = "#e9e9e9";
              if (pipeVars["menuCol"]) {
                menuCol = pipeVars["menuCol"].replace("0x", "#");
              }
  
              normalCol = "#334455";
              if (pipeVars["normalCol"]) {
                normalCol = pipeVars["normalCol"].replace("0x", "#");
              }
  
              overCol = "#556677";
              if (pipeVars["overCol"]) {
                overCol = pipeVars["overCol"].replace("0x", "#");
              }
  
              //check permission dialog feature
              if (webRtcClient == true) {
                if ("permissions" in navigator) {
                  navigator.permissions.query({ name: 'microphone' }).then(function (permissionObj) {
                    //console.log("mic permission " + permissionObj.state);
                    micPerm = permissionObj.state;
                  }).catch(function (error) {
                    //console.log('Error on permission state :', error);
                  });
  
                  navigator.permissions.query({ name: 'camera' }).then(function (permissionObj) {
                    //console.log("cam permission " + permissionObj.state);
                    camPerm = permissionObj.state;
                  }).catch(function (error) {
                    //console.log('Error on permission state:', error);
                  });
                }
              }
  
              //======================== Init screen =======================
  
              //set fixed height to avoid clipping when loading different screens
              pq.$("#" + pipeElement).height(pipeVars["size"]["height"]);
  
              // Remove any unwanted letters before the value for the width
              pipeVars["size"]["width"] = pipeVars["size"]["width"].toString().replace(/^\D+/, '');
  
              // Checking if the width size has a unit
              defaultUnit = "px";
              // Add the default unit, if the width is a number without any units specified
              if (!/\D$/.test(pipeVars["size"]["width"])) {
                pipeVars["size"]["width"] = pipeVars["size"]["width"] + defaultUnit;
              } else {
                // Checking if the given unit is valid. If not, add the default unit
                if (!/(^-?\d*\.?\d+)(em|ex|ch|rem|vw|vh|vmin|vmax|cm|mm|in|px|pt|pc|%)$/.test(pipeVars["size"]["width"])) {
                  pipeVars["size"]["width"] = pipeVars["size"]["width"].toString().replace(/[^0-9.]/g, '') + defaultUnit;
                }
              }
  
              if (closedAccount == 0) {
                if (maintenance == 1) {
                  pq.$("#" + pipeElement).html('<div id="pipeRecordRTC-' + pipeElement + '" class="pipeRecordRTC"><span>Video recording is in maintenance</span></div>');
                  //custom style for elements
                  pq.$("#pipeRecordRTC-" + pipeElement).css("width", pipeVars["size"]["width"]).css("height", pipeVars["size"]["height"] + "px").css("backgroundColor", bgCol).css("borderRadius", cornerRadius + "px");
                  document.getElementById("pipeRecordRTC-" + pipeElement).getElementsByTagName("span")[0].style.color = normalCol;
                } else {
                  //detect the language
                  var detectedLang = prefLang;
                  if (detectedLang == "fr" || detectedLang == "de" || detectedLang == "es") {
                    langCode = detectedLang;
                  }
  
                  languageFileURL = "https://cdn.addpipe.com/2.0/" + (pipeVars["lang"] ? pipeVars["lang"] : 'translations/' + langCode + '.xml');
                  if (pipeVars["lang"]) {
                    if (pipeVars["lang"].indexOf("http") != -1) {
                      languageFileURL = pipeVars["lang"];
                    }
                  }
  
                  // Load the language XML file
                  pq.ajax({
                    url: languageFileURL,
                    dataType: 'xml',
                    async: false,
                    success: function (data) {
                      var xml_node = pq.$('xliff', data);
  
                      if (pipeVars["ao"] == 1) {
                        recordTxt = xml_node.find('xliff > file > body > trans-unit[resname="IDS_RECORD_INIT_AUDIO"] > source').text();
                        if (recordTxt == "") {
                          recordTxt = "Record Audio";
                        }
                      } else {
                        recordTxt = xml_node.find('xliff > file > body > trans-unit[resname="IDS_RECORD_INIT"] > source').text();
                        if (recordTxt == "") {
                          recordTxt = "Record Video";
                        }
                      }
  
                      if (pipeVars["ao"] == 1) {
                        uploadRecTxt = xml_node.find('xliff > file > body > trans-unit[resname="IDS_UPLOAD_AUDIO_DESKTOP"] > source').text();
                        if (uploadRecTxt == "") {
                          uploadRecTxt = "Upload Audio";
                        }
                      } else {
                        uploadRecTxt = xml_node.find('xliff > file > body > trans-unit[resname="IDS_UPLOAD_VIDEO_DESKTOP"] > source').text();
                        if (uploadRecTxt == "") {
                          uploadRecTxt = "Upload Video";
                        }
                      }
  
                      uploadingTxt = xml_node.find('xliff > file > body > trans-unit[resname="IDS_MOBILE_UPLOADING"] > source').text();
                      if (uploadingTxt == "") {
                        uploadingTxt = "Uploading";
                      }
                      unsupportedTxt = xml_node.find('xliff > file > body > trans-unit[resname="IDS_MOBILE_UNSUPPORTED"] > source').text();
                      if (unsupportedTxt == "") {
                        unsupportedTxt = "Unsupported file type!";
                      }
                      maxFileSizeTxt = xml_node.find('xliff > file > body > trans-unit[resname="IDS_MAX_UPLOAD_SIZE"] > source').text();
                      if (maxFileSizeTxt == "") {
                        maxFileSizeTxt = "Maximum allowed file size is";
                      }
                      upgradeTxt = xml_node.find('xliff > file > body > trans-unit[resname="IDS_MOBILE_UPGRADE"] > source').text();
                      if (upgradeTxt == "") {
                        upgradeTxt = "Please upgrade your browser! Your current one lacks the features needed to record & submit videos.";
                      }
                      uploadFailedTxt = xml_node.find('xliff > file > body > trans-unit[resname="IDS_MOBILE_UPLOAD_FAILED"] > source').text();
                      if (uploadFailedTxt == "") {
                        uploadFailedTxt = "Upload failed!";
                      }
                      doneTxt = xml_node.find('xliff > file > body > trans-unit[resname="IDS_MOBILE_DONE"] > source').text();
                      if (doneTxt == "") {
                        doneTxt = "Done!";
                      }
                      uploadOrRecordAnotherTxt = xml_node.find('xliff > file > body > trans-unit[resname="IDS_UPLOAD_AGAIN_DESKTOP"] > source').text();
                      if (uploadOrRecordAnotherTxt == "") {
                        uploadOrRecordAnotherTxt = "Record or upload another one";
                      }
                      recordScreenTxt = xml_node.find('xliff > file > body > trans-unit[resname="IDS_RECORD_SCREEN"] > source').text();
                      if (recordScreenTxt == "") {
                        recordScreenTxt = "Record Screen";
                      }
                      selectScreenTxt = xml_node.find('xliff > file > body > trans-unit[resname="IDS_SELECT_SCREEN"] > source').text();
                      if (selectScreenTxt == "") {
                        selectScreenTxt = "Select screen for capture";
                      }
                      installExtensionTxt = xml_node.find('xliff > file > body > trans-unit[resname="IDS_RECORD_SCREEN_INSTALL_EXTENSION"] > source').text();
                      if (installExtensionTxt == "") {
                        installExtensionTxt = "To record the screen you need to install the";
                      }
                      screenPermissionTxt = xml_node.find('xliff > file > body > trans-unit[resname="IDS_RECORD_SCREEN_PERMISSION_ERROR"] > source').text();
                      if (screenPermissionTxt == "") {
                        screenPermissionTxt = "Permission was denied. Could not get screen stream";
                      }
                      recBtnTxt = xml_node.find('xliff > file > body > trans-unit[resname="IDS_TXT_RECORD"] > source').text();
                      if (recBtnTxt == "") {
                        recBtnTxt = "record";
                      }
                      stopBtnTxt = xml_node.find('xliff > file > body > trans-unit[resname="IDS_TXT_STOP"] > source').text();
                      if (stopBtnTxt == "") {
                        stopBtnTxt = "stop";
                      }
                      playBtnTxt = xml_node.find('xliff > file > body > trans-unit[resname="IDS_TXT_PLAY"] > source').text();
                      if (playBtnTxt == "") {
                        playBtnTxt = "play";
                      }
                      pauseBtnTxt = xml_node.find('xliff > file > body > trans-unit[resname="IDS_TXT_PAUSE"] > source').text();
                      if (pauseBtnTxt == "") {
                        pauseBtnTxt = "pause";
                      }
                      saveBtnTxt = xml_node.find('xliff > file > body > trans-unit[resname="IDS_TXT_SAVE"] > source').text();
                      if (saveBtnTxt == "") {
                        saveBtnTxt = "Save";
                      }
                      connectingTxt = xml_node.find('xliff > file > body > trans-unit[resname="IDS_TXT_CONNECT"] > source').text();
                      if (connectingTxt == "") {
                        connectingTxt = "Connecting...";
                      }
                      bufferingTxt = xml_node.find('xliff > file > body > trans-unit[resname="IDS_TXT_BUFFERING"] > source').text();
                      if (bufferingTxt == "") {
                        bufferingTxt = "Buffering...";
                      }
                      savingTxt = xml_node.find('xliff > file > body > trans-unit[resname="IDS_TXT_SAVING"] > source').text();
                      if (savingTxt == "") {
                        savingTxt = "Saving...";
                      }
                      savedTxt = xml_node.find('xliff > file > body > trans-unit[resname="IDS_TXT_SAVEOK"] > source').text();
                      if (savedTxt == "") {
                        savedTxt = "Saved";
                      }
  
                      withSysAudioTxt = xml_node.find('xliff > file > body > trans-unit[resname="IDS_TXT_WITHSYSAUDIO"] > source').text();
                      if (withSysAudioTxt == "") {
                        withSysAudioTxt = "(with system audio)";
                      }
  
                      if (pipeVars["ao"] == 1) {
                        blockedTxt = xml_node.find('xliff > file > body > trans-unit[resname="IDS_TXT_ICAMERA2_AUDIO"] > source').text();
                        if (blockedTxt == "") {
                          blockedTxt = "You blocked microphone access. Unblock from the address bar to try again";
                        }
                      } else {
                        blockedTxt = xml_node.find('xliff > file > body > trans-unit[resname="IDS_TXT_ICAMERA2"] > source').text();
                        if (blockedTxt == "") {
                          blockedTxt = "You blocked camera and microphone access. Unblock from the address bar to try again";
                        }
                      }
  
                      noCameraTxt = xml_node.find('xliff > file > body > trans-unit[resname="IDS_TXT_ICAMERA"] > source').text();
                      if (noCameraTxt == "") {
                        noCameraTxt = "Connect a microphone or camera with microphone to record audio or video";
                      }
                      noMicTxt = xml_node.find('xliff > file > body > trans-unit[resname="IDS_TXT_NO_MIC"] > source').text();
                      if (noMicTxt == "") {
                        noMicTxt = "You do not have a microphone installed";
                      }
  
                      if (pipeVars["ao"] == 1) {
                        allowAccessTxt = xml_node.find('xliff > file > body > trans-unit[resname="IDS_ALLOW_ACCESS_AUDIO"] > source').text();
                        if (allowAccessTxt == "") {
                          allowAccessTxt = "Allow {DOMAIN_NAME} to use your microphone";
                        }
                      } else {
                        allowAccessTxt = xml_node.find('xliff > file > body > trans-unit[resname="IDS_ALLOW_ACCESS"] > source').text();
                        if (allowAccessTxt == "") {
                          allowAccessTxt = "Allow {DOMAIN_NAME} to use your camera and microphone";
                        }
                      }
                      allowAccessTxt = allowAccessTxt.replace("{DOMAIN_NAME}", "<strong>" + window.location.hostname + "</strong>");
  
                      allowMicAccessTxt = xml_node.find('xliff > file > body > trans-unit[resname="IDS_ALLOW_ACCESS_AUDIO"] > source').text();
                      if (allowMicAccessTxt == "") {
                        allowMicAccessTxt = "Allow {DOMAIN_NAME} to use your microphone";
                      }
                      allowMicAccessTxt = allowMicAccessTxt.replace("{DOMAIN_NAME}", "<strong>" + window.location.hostname + "</strong>");
  
                      micIconTxt = xml_node.find('xliff > file > body > trans-unit[resname="IDS_MIC_DEVICE"] > source').text();
                      if (micIconTxt == "") {
                        micIconTxt = "Microphone used: ";
                      }
  
                      camIconTxt = xml_node.find('xliff > file > body > trans-unit[resname="IDS_CAM_DEVICE"] > source').text();
                      if (camIconTxt == "") {
                        camIconTxt = "Camera used: ";
                      }
  
                      uploadingTxt = xml_node.find('xliff > file > body > trans-unit[resname="IDS_TXT_UPLOAD"] > source').text();
                      if (uploadingTxt == "") {
                        uploadingTxt = "Uploading...";
                      }
                      camUsedTxt = xml_node.find('xliff > file > body > trans-unit[resname="IDS_TXT_CAM_USED"] > source').text();
                      if (camUsedTxt == "") {
                        camUsedTxt = "The camera is already used by another app";
                      }
                      conInterruptedTxt = xml_node.find('xliff > file > body > trans-unit[resname="IDS_TXT_CON_INTERRUPTED"] > source').text();
                      if (conInterruptedTxt == "") {
                        conInterruptedTxt = "Your connection to the server has been interrupted";
                      }
                      inputMicTitleTxt = xml_node.find('xliff > file > body > trans-unit[resname="IDS_INPUT_MENU_MIC_TITLE"] > source').text();
                      if (inputMicTitleTxt == "") {
                        inputMicTitleTxt = "Microphone";
                      }
                      inputCamTitleTxt = xml_node.find('xliff > file > body > trans-unit[resname="IDS_INPUT_MENU_CAM_TITLE"] > source').text();
                      if (inputCamTitleTxt == "") {
                        inputCamTitleTxt = "Camera";
                      }
                      blurBgCheckTxt = xml_node.find('xliff > file > body > trans-unit[resname="IDS_INPUT_MENU_BLUR_CHECK"] > source').text();
                      if (blurBgCheckTxt == "") {
                        blurBgCheckTxt = "Select devices";
                      }
  
                      downloadText = xml_node.find('xliff > file > body > trans-unit[resname="IDS_TXT_DOWNLOAD"] > source').text();
                      if (downloadText == "") {
                        downloadText = "Download";
                      }
  
                      unableToSaveTxt = xml_node.find('xliff > file > body > trans-unit[resname="IDS_TXT_UNABLE_TO_SAVE"] > source').text();
                      if (unableToSaveTxt == "") {
                        unableToSaveTxt = "Unable to save recording";
                      }
  
                      //we force the initial screen so that we can show the notification if the browser is not compatible
                      if (webRtcClient == false) {
                        pipeVars["sis"] = 0;
                      }
  
                      if (pipeVars["sis"] == 0 || pipeVars["sis"] == undefined) {
  
                        //accept = 'accept="video/*"';
                        accept = 'accept=""';
                        recordIcon = '<svg id="recordIcon" height="30px" class="pipeSvgIcon" version="1.1" viewBox="0 0 512 512" width="30px" xml:space="preserve" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><g><path d="M303.7,128h-221C63.9,128,47,142.1,47,160.7v187.9c0,18.6,16.9,35.4,35.7,35.4h221c18.8,0,33.3-16.8,33.3-35.4V160.7   C337,142.1,322.5,128,303.7,128z"/><path d="M367,213v85.6l98,53.4V160L367,213z"/><rect rx="10" x="80" y="160" width="80" height="60" style="fill:red;" /></g></svg>';
                        if (pipeVars["ao"] == 1) {
                          accept = 'accept="audio/*"';
                          recordIcon = '<svg id="recordIcon" height="30px" class="pipeSvgIcon" version="1.1" viewBox="120 0 273 512" width="16px" xml:space="preserve" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><g><path d="M256,353.5c43.7,0,79-37.5,79-83.5V115.5c0-46-35.3-83.5-79-83.5c-43.7,0-79,37.5-79,83.5V270   C177,316,212.3,353.5,256,353.5z"/><path d="M367,192v79.7c0,60.2-49.8,109.2-110,109.2c-60.2,0-110-49-110-109.2V192h-19v79.7c0,67.2,53,122.6,120,127.5V462h-73v18   h161v-18h-69v-62.8c66-4.9,117-60.3,117-127.5V192H367z"/></g></svg>';
                        }
  
                        uploadIcon = '<svg id="pipeUploadIcon-' + pipeElement + '" height="30px" class="pipeSvgIcon" version="1.1" viewBox="0 0 512 512" width="30px" xml:space="preserve" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><path d="M398.1,233.2c0-1.2,0.2-2.4,0.2-3.6c0-65-51.8-117.6-115.7-117.6c-46.1,0-85.7,27.4-104.3,67c-8.1-4.1-17.2-6.5-26.8-6.5  c-29.5,0-54.1,21.9-58.8,50.5C57.3,235.2,32,269.1,32,309c0,50.2,40.1,91,89.5,91H224v-80l-48.2,0l80.2-83.7l80.2,83.6l-48.2,0v80  h110.3c45.2,0,81.7-37.5,81.7-83.4C480,270.6,443.3,233.3,398.1,233.2z"/></svg>';
                        recordScreenIcon = '<svg height="30px" class="pipeSvgIcon" version="1.1" viewBox="0 0 512 512" width="30px" xml:space="preserve" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><g><path d="M468.7,64H43.3c-6,0-11.3,5-11.3,11.1v265.7c0,6.2,5.2,11.1,11.3,11.1h425.4c6,0,11.3-5,11.3-11.1V75.1   C480,69,474.8,64,468.7,64z M448,320H64V96h384V320z"/><path d="M302.5,448c28-0.5,41.5-3.9,29-12.5c-12.5-8.7-28.5-15.3-29-22.5c-0.3-3.7-1.7-45-1.7-45H256h-44.8c0,0-1.5,41.3-1.7,45   c-0.5,7.1-16.5,13.8-29,22.5c-12.5,8.7,1,12,29,12.5H302.5z"/></g></svg>';
  
                        if (showPoweredBy == 0) {
                          pq.$("#" + pipeElement).html(`
                          <div id="pipeRecordRTC-${pipeElement}" class="pipeRecordRTC">
                              <span>
                                  <div id="pipeStartRecording-${pipeElement}" tabindex="0">
                                      ${recordIcon} ${recordTxt}
                                  </div>
                                  <div id="pipe-upload-form-${pipeElement}">
                                      <div id="pipe-upload-wrap-${pipeElement}" tabindex="0">
                                          ${uploadIcon}
                                          <label id="pipeCustomUpload-${pipeElement}" class="pipe-upload-label pipeCustomUpload" for="pipeStartUploading-${pipeElement}">
                                              &nbsp;&nbsp;${uploadRecTxt}
                                          </label>
                                          <input name="FileInput" id="pipeStartUploading-${pipeElement}" class="pipeStartUploading" type="file" ${accept} value="Start Uploading" tabindex="-1"/>
                                      </div>
                                  </div>
                                  <div id="output-${pipeElement}" style="cursor:default;"></div>
                                  <div id="pipeRecordScreen-${pipeElement}" tabindex="0">
                                      ${recordScreenIcon}&nbsp;${recordScreenTxt}
                                  </div>
                              </span>
                              <div id="uploadAnother-${pipeElement}" class="pipeUploadAnother" tabindex="0">
                                  ${uploadOrRecordAnotherTxt}
                              </div>
                          </div>`);
                        } else {
                          pq.$("#" + pipeElement).html(`
                          <div id="pipeRecordRTC-${pipeElement}" class="pipeRecordRTC">
                              <span>
                                  <div id="pipeStartRecording-${pipeElement}" tabindex="0">
                                      ${recordIcon} ${recordTxt}
                                  </div>
                                  <div id="pipe-upload-form-${pipeElement}">
                                      <div id="pipe-upload-wrap-${pipeElement}" tabindex="0">
                                          ${uploadIcon}
                                          <label id="pipeCustomUpload-${pipeElement}" class="pipe-upload-label pipeCustomUpload" for="pipeStartUploading-${pipeElement}">
                                              &nbsp;&nbsp;${uploadRecTxt}
                                          </label>
                                          <input name="FileInput" id="pipeStartUploading-${pipeElement}" class="pipeStartUploading" type="file" ${accept} value="Start Uploading" tabindex="-1"/>
                                      </div>
                                  </div>
                                  <div id="output-${pipeElement}" style="cursor:default;"></div>
                                  <div id="pipeRecordScreen-${pipeElement}" tabindex="0">
                                      ${recordScreenIcon}&nbsp;${recordScreenTxt}
                                  </div>
                              </span>
                              <div id="uploadAnother-${pipeElement}" class="pipeUploadAnother" tabindex="0">
                                  ${uploadOrRecordAnotherTxt}
                              </div>
                              <p id="pipeClickPowered-${pipeElement}" title="Pipe Video Recorder" class="pipePoweredBy" style="color:#334455;" tabindex="0">Powered by Pipe</p>
                          </div>`);
                          pq.$("#pipeClickPowered-" + pipeElement).click(poweredByPipe, false).keydown(function (event) {
                            if (event.which == 13) {
                              event.preventDefault();
                              poweredByPipe();
                            }
                          }, false);
                        }
  
                        //custom style for elements
                        pq.$("#pipeRecordRTC-" + pipeElement).css("width", pipeVars["size"]["width"]).css("height", pipeVars["size"]["height"] + "px").css("backgroundColor", bgCol).css("borderRadius", cornerRadius + "px");
                        document.getElementById("pipeRecordRTC-" + pipeElement).getElementsByTagName("span")[0].style.color = normalCol;
  
                        pq.$(`#pipeStartRecording-${pipeElement} #pipeRecordScreen-${pipeElement} #pipeCustomUpload-${pipeElement}`).on("mouseover", function () {
                          this.style.color = overCol;
                        }).on("mouseout", function () {
                          this.style.color = normalCol;
                        });
  
                        pq.$(`#uploadAnother-${pipeElement} #pipeCustomUpload-${pipeElement}`).css("color", normalCol);
  
                        //disable the recording button and show the notification if the browser is not compatible
                        if (webRtcClient == false) {
                          pq.$("#recordIcon").css("fill", "rgb(51, 68, 85,0.3)").css("cursor", "default");
                          pq.$(`#pipeStartRecording-${pipeElement}`).css("color", "rgb(51, 68, 85, 0.3)").css("cursor", "default").off("mouseover").off("mouseout");
                          document.getElementById("pipeStartRecording-" + pipeElement).removeAttribute("tabindex");
  
                          //create notification
                          var notification = document.createElement("div");
                          notification.id = "pipeSafariNotification-" + pipeElement;
                          notification.style.top = "0px";
                          notification.style.left = "calc(" + pipeVars["size"]["width"] + " / " + 2 + " - " + 40 + ")";
                          notification.style.textAlign = "center";
                          notification.style.fontFamily = "sans-serif";
                          notification.style.fontSize = "15px";
                          notification.style.color = "#334455";
                          notification.style.background = "#feffd7";
                          notification.style.display = "inline-block";
                          notification.style.marginTop = "10px";
                          notification.innerHTML = '<p style="margin:8px;">Switch to <a href="https://chrome.com/" target="_blank" class="pipeBrowserLink">Chrome</a>, <a href="https://firefox.com" target="_blank" class="pipeBrowserLink">Firefox</a> or <a href="https://www.microsoft.com/edge" target="_blank" class="pipeBrowserLink">Edge</a> to record directly in the browser</p>';
  
                          if (isSecureContext == false) {
                            //change the notification text
                            notification.innerHTML = '<p style="margin:8px;">Recording is only possible over https</p>';
                          }
  
                          document.getElementById("pipeRecordRTC-" + pipeElement).insertBefore(notification, document.getElementById("pipeRecordRTC-" + pipeElement).firstChild);
                        }
  
                        pq.$("#uploadAnother-" + pipeElement).hide();
                        pq.$("#pipe-upload-wrap-" + pipeElement).hide();
                        if (pipeVars["dup"] == 1 && (accType == 50 || accType == 1)) {
                          pq.$("#pipe-upload-wrap-" + pipeElement).show();
                        }
  
                        pq.$("pipeUploadIcon-" + pipeElement).click(function () {
                          document.getElementById("pipeStartUploading-" + pipeElement).click();
                        });
                        pq.$('#pipe-upload-wrap-' + pipeElement).keydown(function (event) {
                          if (event.which == 13) {
                            event.preventDefault();
                            document.getElementById("pipeStartUploading-" + pipeElement).click();
                          }
                        });
  
                        document.getElementById("pipeStartUploading-" + pipeElement).onchange = function () {
  
                          if (pq.$('#pipeStartUploading-' + pipeElement).val() != "") {
                            extraParams = {
                              uploadingTxt: uploadingTxt,
                              unsupportedTxt: unsupportedTxt,
                              maxFileSizeTxt: maxFileSizeTxt,
                              upgradeTxt: upgradeTxt,
                              uploadingTxt: uploadingTxt,
                              doneTxt: doneTxt,
                              normalCol: normalCol,
                              accType: accType,
                              webRtcClient: webRtcClient
                            };
  
                            pipeDesktopUploader.addPipeDesktopUploader(pipeElement, pipeVars, extraParams);
                            pipeDesktopUploader.sendData(pipeElement, pipeVars, pipeDesktopUploader.options);
                          }
                        };
  
                        //webcam recording (default)
                        pq.$('#pipeStartRecording-' + pipeElement).click(pipeInitRecorder).keydown(function (event) {
                          if (event.which == 13) {
                            event.preventDefault();
                            pipeInitRecorder();
                          }
                        });
  
                        //if avrec exists and is disabled, we hide the option, but only if there is at least one other option enabled (screen recording or desktop upload)
                        if (pipeVars["avrec"] == 0) {
                          if (pipeVars["srec"] == 1 || pipeVars["dup"] == 1) {
                            pq.$('#pipeStartRecording-' + pipeElement).hide().off("click").off("keydown");
                          }
                        }
  
                        //screen recording
                        pq.$('#pipeRecordScreen-' + pipeElement).hide();
                        if (pipeVars["srec"] && pipeVars["srec"] != 0 && (accType == 50 || accType == 1) && webRtcClient == true && navigator.userAgent.toLowerCase().indexOf("android") == -1) {
                          if ("mediaDevices" in navigator && "getDisplayMedia" in navigator.mediaDevices) {
                            if ("getUserMedia" in navigator || "mediaDevices" in navigator && "getUserMedia" in navigator.mediaDevices) {
                              if (typeof MediaRecorder === "function" && typeof MediaRecorder.isTypeSupported === "function") {
                                if ("readyState" in MediaStreamTrack.prototype) {
                                  pq.$('#pipeRecordScreen-' + pipeElement).show().click(pipeInitScreenRecorder).keydown(function (event) {
                                    if (event.which == 13) {
                                      event.preventDefault();
                                      pipeInitScreenRecorder();
                                    }
                                  });
                                }
                              }
                            }
                          }
                        }
  
                        //API object
                        if (webRtcClient == true) {
                          PipeSDK.recorders[pipeElement] = new Object();
                          //Init screen remove function HTML5
                          PipeSDK.recorders[pipeElement].remove = function () {
                            pq.$("#" + pipeElement).html("").css("height", "0px");
                            pq.clearCacheById(pipeElement);
                          };
  
                          pipeHandlers(pipeElement);
                          PipeSDK.recorders[pipeElement].name = pipeElement;
                          callback(PipeSDK.recorders[pipeElement]);
                          //console.log("inserting " + pipeElement);
                        } else {
  
                          PipeSDK.recorders[pipeElement] = document.getElementById(pipeElement);
                          //Init screen remove function
                          PipeSDK.recorders[pipeElement].remove = function () {
                            pq.$("#" + pipeElement).html("").css("height", "0px");
                            pq.clearCacheById(pipeElement);
                          };
  
                          pipeHandlers(pipeElement);
  
                          callback(PipeSDK.recorders[pipeElement]);
  
                          //console.log("insert" + PipeSDK.recorders[pipeElement]);
                        }
                      } else {
  
                        //initial screen skipped, we go directly to the recorder
  
                        //API object
                        if (webRtcClient == true) {
                          PipeSDK.recorders[pipeElement] = new Object();
                          //Init screen remove function HTML5
                          PipeSDK.recorders[pipeElement].remove = function () {
                            pq.$("#" + pipeElement).html("").css("height", "0px");
                            pq.clearCacheById(pipeElement);
                          };
  
                          pipeHandlers(pipeElement);
  
                          callback(PipeSDK.recorders[pipeElement]);
                          //console.log("insert" + PipeSDK.recorders[pipeElement]);
                        }
  
                        if (pipeVars["avrec"] == 0) {
                          if (pipeVars["srec"] == 1) {
                            pipeInitScreenRecorder();
                          } else {
                            //if neither avrec or srec is set, we default to camera recording
                            pipeInitRecorder();
                          }
                        } else {
                          pipeInitRecorder();
                        }
                      }
                    },
                    error: function (xhr, status, error) {
                      console.log("Error occurred while fetching language file data.", status, error);
                    }
                  });
                }
              } else {
                //closedAccount is 1; precheck errored out for some reason
                let displayedMessage = "Add video recording to your website using Pipe";
                if (precheckError) {
                  displayedMessage = precheckError;
                }
                pq.$("#" + pipeElement).html('<div id="pipeRecordRTC-' + pipeElement + '" class="pipeRecordRTC"><span id="pipeRedirect-' + pipeElement + '">' + displayedMessage + '</p></div>');
  
                //custom style for elements
                pq.$("#pipeRecordRTC-" + pipeElement).css("width", pipeVars["size"]["width"]).css("height", pipeVars["size"]["height"] + "px").css("backgroundColor", bgCol).css("borderRadius", cornerRadius + "px");
  
                if (displayedMessage == "Add video recording to your website using Pipe") {
                  pq.$('#pipeRedirect-' + pipeElement).css("textDecoration", "underline").click(pipeAd);
                } else {
                  pq.$('#pipeRedirect-' + pipeElement).css("cursor", "default");
                }
              }
  
              // Reset styling for placeholder
              pq.$("#" + pipeElement).css("display", "block");
              document.getElementById(pipeElement).style.removeProperty("width");
              document.getElementById(pipeElement).style.removeProperty("background");
  
              function pipeInitRecorder() {
  
                if (webRtcClient == false) {
                  return;
                }
  
                if (webRtcClient == true) {
  
                  recordingScreen = false;
                  pipeRTCRecorder.addPipeRTCRecorder(pipeElement, pipeVars, qualityProfileData);
  
                  //console.log("init" + PipeSDK.recorders[pipeElement]);
                }
              }
  
              function pipeInitScreenRecorder() {
  
                if (webRtcClient == false) {
                  return;
                }
  
                if (pipeVars["srec"] && pipeVars["srec"] != 0 && (accType == 50 || accType == 1) && webRtcClient == true && navigator.userAgent.toLowerCase().indexOf("android") == -1) {
                  if ("mediaDevices" in navigator && "getDisplayMedia" in navigator.mediaDevices) {
                    if ("getUserMedia" in navigator || "mediaDevices" in navigator && "getUserMedia" in navigator.mediaDevices) {
                      if (typeof MediaRecorder === "function" && typeof MediaRecorder.isTypeSupported === "function") {
                        if ("readyState" in MediaStreamTrack.prototype) {
                          recordingScreen = true;
                          pipeRTCRecorder.addPipeRTCRecorder(pipeElement, pipeVars, qualityProfileData);
                          //console.log("init" + PipeSDK.recorders[pipeElement]);
                        }
                      }
                    }
                  }
                }
              }
  
              function poweredByPipe() {
                window.location.href = "https://addpipe.com?ref=embed";
              }
  
              function pipeAd() {
                window.location.href = "https://addpipe.com?ref=expired";
              }
            }
          },
          error: function (xhr, status, error) {
            console.log("Error occurred while checking Precheck data.", status, error);
          },
          dataType: "json",
          async: false
        });
  
        function pipeHandlers(rec) {
          // JS Events API callback handlers
          //Desktop
          PipeSDK.recorders[rec].onReadyToRecord = function (recorderId, recorderType) {};
          PipeSDK.recorders[rec].userHasCamMic = function (recorderId, cam_number, mic_number) {};
          PipeSDK.recorders[rec].btRecordPressed = function (recorderId) {};
          PipeSDK.recorders[rec].btStopRecordingPressed = function (recorderId) {};
          PipeSDK.recorders[rec].btPlayPressed = function (recorderId) {};
          PipeSDK.recorders[rec].btPausePressed = function (recorderId) {};
          PipeSDK.recorders[rec].onUploadProgress = function (recorderId, percent) {};
          PipeSDK.recorders[rec].onUploadDone = function (recorderId, streamName, streamDuration, audioCodec, videoCodec, fileType, audioOnly, location) {};
          PipeSDK.recorders[rec].onCamAccess = function (recorderId, allowed) {};
          PipeSDK.recorders[rec].onPlaybackComplete = function (recorderId) {};
          PipeSDK.recorders[rec].onRecordingStarted = function (recorderId) {};
          PipeSDK.recorders[rec].onConnectionClosed = function (recorderId) {};
          PipeSDK.recorders[rec].onConnectionStatus = function (recorderId, status) {};
          PipeSDK.recorders[rec].onMicActivityLevel = function (recorderId, currentActivityLevel) {};
          PipeSDK.recorders[rec].onSaveOk = function (recorderId, streamName, streamDuration, cameraName, micName, audioCodec, videoCodec, filetype, videoId, audioOnly, location) {};
          PipeSDK.recorders[rec].onFlashReady = function (recorderId) {};
          //Desktop Upload
          PipeSDK.recorders[rec].onDesktopVideoUploadStarted = function (recorderId, filename, filetype, audioOnly) {};
          PipeSDK.recorders[rec].onDesktopVideoUploadSuccess = function (recorderId, filename, filetype, videoId, audioOnly, location) {};
          PipeSDK.recorders[rec].onDesktopVideoUploadProgress = function (recorderId, percent) {};
          PipeSDK.recorders[rec].onDesktopVideoUploadFailed = function (recorderId, error) {};
          //Mobile
          PipeSDK.recorders[rec].onVideoUploadStarted = function (recorderId, filename, filetype, audioOnly) {};
          PipeSDK.recorders[rec].onVideoUploadSuccess = function (recorderId, filename, filetype, videoId, audioOnly, location) {};
          PipeSDK.recorders[rec].onVideoUploadProgress = function (recorderId, percent) {};
          PipeSDK.recorders[rec].onVideoUploadFailed = function (recorderId, error) {};
        }
      }).catch(() => {
        console.error("pipe-log at " + new Date().toISOString() + ' PipeSDK.insert() failed: No <div> tag with the id "' + pipeElement + '" is present in the DOM.');
      }); // End of DOM content loaded check (domContentLoaded())
    }, // End of insert()
  
    getRecorderById: function (id) {
      return PipeSDK.recorders[id];
    },
  
    //Pipe custom tag
    replacePipeTag: function () {
      //document.createElement("piperecorder");
  
      var tagInstances = document.getElementsByTagName("piperecorder");
      let recordersAdded = 0;
  
      for (let i = 0; i < tagInstances.length; i++) {
        //console.log(tagInstances[i].attributes);
  
        var pipeParams = {};
  
        var defaultWidth = 320;
        var defaultHeight = 270;
  
        if (tagInstances[i].attributes["pipe-width"] && tagInstances[i].attributes["pipe-height"]) {
          pipeParams["size"] = { width: tagInstances[i].attributes["pipe-width"].value !== "" ? tagInstances[i].attributes["pipe-width"].value : defaultWidth,
            height: tagInstances[i].attributes["pipe-height"].value !== "" ? tagInstances[i].attributes["pipe-height"].value : defaultHeight };
        } else {
          // Only width provided
          if (tagInstances[i].attributes["pipe-width"]) {
            pipeParams["size"] = { width: tagInstances[i].attributes["pipe-width"].value, height: defaultHeight };
          }
          // Only height provided
          else if (tagInstances[i].attributes["pipe-height"]) {
              pipeParams["size"] = { width: defaultWidth, height: tagInstances[i].attributes["pipe-height"].value };
            }
            // Nothing provided
            else {
                pipeParams["size"] = { width: defaultWidth, height: defaultHeight };
              }
        }
  
        for (var key in tagInstances[i].attributes) {
          //console.log(tagInstances[i].attributes[key].name);
  
          if (tagInstances[i].attributes[key].name != "pipe-width" && tagInstances[i].attributes[key].name != "pipe-height") {
            if (tagInstances[i].attributes[key].name == "pipe-accounthash") {
  
              pipeParams["accountHash"] = tagInstances[i].attributes[key].value;
            } else if (tagInstances[i].attributes[key].name == "pipe-showmenu") {
  
              pipeParams["showMenu"] = tagInstances[i].attributes[key].value;
            } else if (tagInstances[i].attributes[key].name == "pipe-bgcol") {
  
              pipeParams["bgCol"] = tagInstances[i].attributes[key].value;
            } else if (tagInstances[i].attributes[key].name == "pipe-menucol") {
  
              pipeParams["menuCol"] = tagInstances[i].attributes[key].value;
            } else if (tagInstances[i].attributes[key].name == "pipe-normalcol") {
  
              pipeParams["normalCol"] = tagInstances[i].attributes[key].value;
            } else if (tagInstances[i].attributes[key].name == "pipe-overcol") {
  
              pipeParams["overCol"] = tagInstances[i].attributes[key].value;
            } else {
  
              if (tagInstances[i].attributes[key].name != undefined && tagInstances[i].attributes[key].name != "removeNamedItem" && tagInstances[i].attributes[key].name != "removeNamedItemNS" && tagInstances[i].attributes[key].name != "setNamedItem" && tagInstances[i].attributes[key].name != "setNamedItemNS" && tagInstances[i].attributes[key].name != "item" && tagInstances[i].attributes[key].name != "getNamedItem" && tagInstances[i].attributes[key].name != "getNamedItemNS" && tagInstances[i].attributes[key].name != "lang") {
                var att = tagInstances[i].attributes[key].name.replace("pipe-", "");
                pipeParams[att] = tagInstances[i].attributes[key].value;
              }
            }
          }
        }
  
        // Get ID of recorder from parameters value
        const idOfRecorder = tagInstances[i].attributes["id"].value;
  
        PipeSDK.insert(idOfRecorder, pipeParams, function (tagRecorder) {
          recordersAdded++;
          if (recordersAdded == tagInstances.length) {
            PipeSDK.onRecordersInserted();
          }
        });
      }
    },
  
    onRecordersInserted: function () {}
  
  };
  
  document.addEventListener("DOMContentLoaded", function (event) {
    PipeSDK.replacePipeTag();
  });
  
  },{"./d_upload.js":1,"./mobile.js":2,"./pipeQuery.js":5,"./rtc.js":6,"socket.io-client/dist/socket.io.min.js":3}],5:[function(require,module,exports){
  /**
   * A simplified jQuery-like class for DOM manipulation.
   * @class
   */
  module.exports = class PipeQuery {
    /**
     * Initializes a new instance of the PipeQuery class.
     * @constructor
     */
    constructor() {
      this.elements = [];
      this.cache = {}; // Based on element's ID. If there is no ID, caching is not possible.
    }
  
    /**
     * Sets a value in the cache for the specified key for the specified id.
     * @private
     * @param {string} id - The id of the DOM element for which to set the cache.
     * @param {string} key - The key to set in the cache.
     * @param {any} value - The value to associate with the key.
     * @returns {void}
     */
    _setCache(id, key, value) {
      if (!id || !key || !value) return;
      if (!this.cache[id]) {
        this.cache[id] = {};
      }
      this.cache[id][key] = value;
    }
  
    /**
     * Retrieves a value from the cache for the specified element id and key.
     * @private
     * @param {string} id - The id of the DOM element for which to retrieve the cached value.
     * @param {string} key - The key used for caching.
     * @returns {any | undefined} The cached value, or undefined if not found.
     */
    _getCache(id, key) {
      if (!id || !key) return;
      if (!this.cache[id]) return;
      if (!this.cache[id][key]) return;
      return this.cache[id][key];
    }
  
    /**
     * Sets the cache value for an element's event and it's related callback function.
     * @private
     * @param {string} id - The id of the element for which to save the cache value.
     * @param {string} event - The event for which to save the cache value.
     * @param {Function} callback - The callback function assigned to the event.
     */
    _setEventCallbackCache(id, event, callback) {
      const callbacks = [];
      // First check if there is another callback assigned to the event to add to cache
      const sameEventCallback = this._getCache(id, event) || [];
      if (sameEventCallback.length > 0) {
        callbacks.push(...sameEventCallback);
      }
      callbacks.push(callback);
      this._setCache(id, event, callbacks);
    }
  
    /**
     * Returns a PipeQuery instance by selecting elements based on one or more CSS selectors.
     * @param {string|HTMLElement} selectors - One or more space-separated CSS selectors.
     * @param {Element|Document|DocumentFragment} [context=document] - The context in which to search for elements. Defaults to document if not provided.
     * @returns {PipeQuery} - The PipeQuery instance for chaining.
     */
    $(selectors, context = document) {
      this.elements = [];
      if (selectors) {
        // Check if the selectors parameter is a CSS selector
        if (typeof selectors === "string" && selectors.startsWith("<")) {
          // If it starts with "<", treat it as an HTML string
          try {
            const template = document.createElement("template");
            template.innerHTML = selectors.trim();
            this.elements.push(...template.content.childNodes);
          } catch (error) {
            console.log("Invalid HTML string:", selectors);
          }
        } else if (typeof selectors === "string") {
          // If it's a regular CSS selector
          const selectorList = selectors.split(" ");
          selectorList.forEach(selector => {
            try {
              if (context && context.querySelectorAll) {
                const selectedElements = Array.from(context.querySelectorAll(selector));
                selectedElements.length > 0 && this.elements.push(...selectedElements);
              } else {
                console.log("Invalid PipeQuery context:", context);
              }
            } catch (error) {
              console.log("Invalid PipeQuery selector:", selector);
            }
          });
        } else if (selectors instanceof HTMLElement) {
          // If it's an HTML element, treat it as a single element
          this.elements.push(selectors);
        } else {
          // Log an error for unsupported input
          console.log("Invalid PipeQuery selectors:", selectors);
        }
      }
      return this;
    }
  
    /**
     * Clears a certain element's cache by id.
     * @param {string} id - The id of the element for which to clear the cache.
     */
    clearCacheById(id) {
      if (!id) return;
      for (const key in this.cache) {
        if (key.includes(id)) {
          delete this.cache[key];
        }
      }
    }
  
    /**
     * Adds a click event listener to the selected elements.
     * @param {Function} callback - The function to execute when the click event occurs.
     * @param {boolean} [toCache=true] - Weather to cache the callback or not. Default is true.
     * @returns {PipeQuery} - The PipeQuery instance for chaining.
     */
    click(callback, toCache = true) {
      this.elements.forEach(element => {
        element.addEventListener("click", callback);
  
        if (!toCache) return;
        this._setEventCallbackCache(element.id, "click", callback);
      });
      return this;
    }
  
    /**
     * Adds a keydown event listener to the selected elements.
     * @param {Function} callback - The function to execute when the keydown event occurs.
     * @param {boolean} [toCache=true] - Weather to cache the callback or not. Default is true.
     * @returns {PipeQuery} - The PipeQuery instance for chaining.
     */
    keydown(callback, toCache = true) {
      this.elements.forEach(element => {
        element.addEventListener("keydown", callback);
  
        if (!toCache) return;
        this._setEventCallbackCache(element.id, "keydown", callback);
      });
      return this;
    }
  
    /**
     * Hides the selected elements.
     * @returns {PipeQuery} - The PipeQuery instance for chaining.
     */
    hide() {
      this.elements.forEach(element => {
        if (element.style.display && // If a value is available.
        element.style.display !== "block" && // Do not save the default value ("block").
        element.style.display !== "none" // Do not save value if it is hidden already.
        ) {
            this._setCache(element.id, "display", element.style.display);
          }
        element.style.display = "none";
      });
      return this;
    }
  
    /**
     * Shows the selected elements.
     * @param {string} [displayVal] - The new display value.
     * @returns {PipeQuery} - The PipeQuery instance for chaining.
     */
    show(displayVal) {
      this.elements.forEach(element => {
        const newDisplayValue = displayVal ? displayVal : this._getCache(element.id, "display") || "block";
        element.style.display = newDisplayValue;
      });
      return this;
    }
  
    /**
     * Gets or sets the value of the first selected element.
     * @param {string} [newVal] - The new value to set.
     * @returns {string|PipeQuery} - The current value or the PipeQuery instance for chaining.
     */
    val(newVal) {
      if (newVal !== undefined) {
        this.elements[0].value = newVal;
        return this;
      } else {
        if (!this.elements[0]) return "";
        return this.elements[0].value;
      }
    }
  
    /**
     * Removes all event handlers or a specific event handler from the selected elements.
     * @param {string} [eventName] - The name of the event to remove handlers for.
     * @returns {PipeQuery} - The PipeQuery instance for chaining.
     */
    off(eventName) {
      this.elements.forEach(element => {
        if (eventName) {
          const callbackValues = this._getCache(element.id, eventName) || [];
          callbackValues.forEach(callbackValue => {
            if (callbackValue) {
              element.removeEventListener(eventName, callbackValue);
            }
          });
          callbackValues.length > 0 && delete this.cache[element.id][eventName];
        } else {
          element.replaceWith(element.cloneNode(true));
        }
      });
  
      return this;
    }
  
    /**
     * Gets or sets the "height" property of the selected elements.
     * @param {string} [val] - The new height value to set.
     * @returns {string|PipeQuery} - The current height value or the PipeQuery instance for chaining.
     */
    height(val) {
      if (val !== undefined) {
        this.elements.forEach(element => {
          // Check if the value contains any letters or symbols (indicating a unit)
          const hasUnit = /[a-zA-Z%]/.test(val); // If no unit is provided, use pixels ("px")
  
          element.style.height = hasUnit ? val : val + "px";
        });
        return this;
      } else {
        if (!this.elements[0]) return "";
        return this.elements[0].style.height;
      }
    }
  
    /**
     * Gets or sets the "width" property of the selected elements.
     * @param {string} [val] - The new width value to set.
     * @returns {string|PipeQuery} - The current width value or the PipeQuery instance for chaining.
     */
    width(val) {
      if (val !== undefined) {
        this.elements.forEach(element => {
          // Check if the value contains any letters or symbols (indicating a unit)
          const hasUnit = /[a-zA-Z%]/.test(val); // If no unit is provided, use pixels ("px")
  
          element.style.width = hasUnit ? val : val + "px";
        });
        return this;
      } else {
        if (!this.elements[0]) return "";
        return this.elements[0].style.width;
      }
    }
  
    /**
     * Gets or sets the text content of the selected elements.
     * @param {string} [text] - The new text content to set.
     * @returns {string|PipeQuery} - The current text content or the PipeQuery instance for chaining.
     */
    text(text) {
      if (text !== undefined) {
        this.elements.forEach(element => {
          element.textContent = text;
        });
        return this;
      } else {
        if (!this.elements[0]) return "";else return this.elements[0].textContent;
      }
    }
  
    /**
     * Find descendant elements within the selected elements.
     * @param {string} selector - The selector expression.
     * @returns {PipeQuery} - A new PipeQuery instance containing the found elements.
     */
    find(selector) {
      const foundElements = this.elements.reduce((acc, element) => {
        try {
          return acc.concat(Array.from(element.querySelectorAll(selector)));
        } catch (error) {
          console.log("Invalid PipeQuery find selector:", selector);
          return acc;
        }
      }, []);
  
      // Create a new PipeQuery instance with the found elements
      const newPipeQuery = new PipeQuery();
      newPipeQuery.elements = foundElements;
  
      return newPipeQuery;
    }
  
    /**
     * Gets or sets the inner HTML content of the selected elements.
     * @param {string} [text] - The new inner HTML content to set.
     * @returns {string|PipeQuery} - The current inner HTML content or the PipeQuery instance for chaining.
     */
    html(text) {
      if (text !== undefined) {
        this.elements.forEach(element => {
          element.innerHTML = text;
        });
        return this;
      } else {
        if (!this.elements[0]) return "";
        return this.elements[0].innerHTML;
      }
    }
  
    /**
     * Adds event listeners for one or more events to the selected elements.
     * @param {string} events - One or more space-separated event names.
     * @param {function} callback - The callback function to execute when the event is triggered.
     * @param {boolean} [toCache=true] - Weather to cache the callback or not. Default is true.
     * @returns {PipeQuery} - The PipeQuery instance for chaining.
     */
    on(events, callback, toCache = true) {
      const eventList = events.split(" ");
  
      eventList.forEach(eventName => {
        // Attach the event listener to each element
        this.elements.forEach(element => {
          // Set event listener
          element.addEventListener(eventName, callback);
  
          if (!toCache) return;
          this._setEventCallbackCache(element.id, eventName, callback);
        });
      });
  
      return this;
    }
  
    /**
     * Gets or sets the value of an attribute for the selected elements.
     * @param {string} attributeName - The name of the attribute.
     * @param {string} [attributeValue] - The new value to set for the attribute.
     * @returns {string|PipeQuery} - The current value of the attribute or the PipeQuery instance for chaining.
     */
    attr(attributeName, attributeValue) {
      if (attributeValue !== undefined) {
        this.elements.forEach(element => {
          element.setAttribute(attributeName, attributeValue);
        });
        return this;
      } else {
        if (!this.elements[0]) return "";
        return this.elements[0].getAttribute(attributeName);
      }
    }
  
    /**
     * Gets or sets the value of a property for the selected elements.
     * @param {string} propertyName - The name of the property.
     * @param {string} [propertyValue] - The new value to set for the property.
     * @returns {string|PipeQuery} - The current value of the property or the PipeQuery instance for chaining.
     */
    prop(propertyName, propertyValue) {
      if (propertyValue !== undefined) {
        this.elements.forEach(element => {
          element[propertyName] = propertyValue;
        });
        return this;
      } else {
        return this.elements[0][propertyName];
      }
    }
  
    /**
     * Appends a child element to the selected elements.
     * @param {Element|string} childElement - The element to append.
     * @returns {PipeQuery} - The PipeQuery instance for chaining.
     */
    append(childElement) {
      this.elements.forEach(element => {
        if (typeof childElement === "string") {
          // Append the HTML string directly
          element.insertAdjacentHTML("beforeend", childElement);
        } else if (childElement instanceof Node) {
          // If childElement is already a DOM node, append it directly
          element.appendChild(childElement);
        }
      });
      return this;
    }
  
    /**
     * Removes the selected elements from the DOM.
     * @returns {PipeQuery} - The PipeQuery instance for chaining.
     */
    remove() {
      this.elements.forEach(element => {
        element.remove();
      });
      return this;
    }
  
    /**
     * Inserts the selected elements before a target element.
     * @param {string|HTMLElement} targetElement - The target element.
     * @returns {PipeQuery} - The PipeQuery instance for chaining.
     */
    insertBefore(targetElement) {
      const elem = targetElement instanceof HTMLElement ? targetElement : document.querySelector(targetElement);
      if (!elem) return this;
  
      this.elements.forEach(element => {
        elem.parentNode.insertBefore(element, elem);
      });
      return this;
    }
  
    /**
     * Inserts the selected elements after a target element.
     * @param {string|HTMLElement} targetElement - The target element.
     * @returns {PipeQuery} - The PipeQuery instance for chaining.
     */
    insertAfter(targetElement) {
      const elem = targetElement instanceof HTMLElement ? targetElement : document.querySelector(targetElement);
      if (!elem) return this;
  
      this.elements.forEach(element => {
        elem.parentNode.insertAfter(element, elem);
      });
      return this;
    }
  
    /**
     * Triggers a specific event on the selected elements.
     * @param {string} eventName - The name of the event to trigger.
     * @returns {PipeQuery} - The PipeQuery instance for chaining.
     */
    trigger(eventName) {
      this.elements.forEach(element => {
        const event = new Event(eventName);
        element.dispatchEvent(event);
      });
      return this;
    }
  
    /**
     * Gets or sets the value of a CSS property for the selected elements.
     * @param {string} cssProperty - The name of the CSS property.
     * @param {string} [value] - The new value to set for the CSS property.
     * @returns {string|PipeQuery} - The current value of the CSS property or the PipeQuery instance for chaining.
     */
    css(cssProperty, value) {
      if (value !== undefined) {
        this.elements.forEach(element => {
          element.style[cssProperty] = value;
        });
        return this;
      } else {
        if (!this.elements[0]) return "";
        return this.elements[0].style[cssProperty];
      }
    }
  
    /**
     * Performs a simple animation on the selected elements.
     * @param {object} animationData - An object containing CSS properties and their target values.
     * @param {number} duration - The duration of the animation in milliseconds.
     * @returns {PipeQuery} - The PipeQuery instance for chaining.
     */
    animate(animationData, duration) {
      const keyframes = [{}, {}];
  
      // Initialize the keyframes with the starting and ending values
      Object.entries(animationData).forEach(([property, targetValue]) => {
        keyframes[0][property] = getComputedStyle(this.elements[0])[property];
        keyframes[1][property] = targetValue;
      });
  
      // Loop through all elements and animate each one
      this.elements.forEach(element => {
        element.animate(keyframes, {
          duration,
          fill: "forwards"
        });
      });
  
      return this;
    }
  
    /**
     * Removes an event handler for a specific event from the selected elements.
     * @param {string} eventName - The name of the event to remove the handler for.
     * @param {function} [callback] - The specific callback function to remove. If not provided, removes all event handlers for the specified events.
     * @returns {PipeQuery} - The PipeQuery instance for chaining.
     */
    unbind(eventName, callback) {
      this.elements.forEach(element => {
        if (eventName) {
          if (callback) {
            element.removeEventListener(eventName, callback);
            return;
          }
          const callbackValues = this._getCache(element.id, eventName) || [];
          callbackValues.forEach(callbackValue => {
            if (callbackValue) {
              element.removeEventListener(eventName, callbackValue);
            }
          });
          callbackValues.length > 0 && delete this.cache[element.id][eventName];
        } else {
          element.replaceWith(element.cloneNode(true));
        }
      });
  
      return this;
    }
  
    /**
     * Removes a class from the selected elements.
     * @param {string} className - The class name to remove.
     * @returns {PipeQuery} - The PipeQuery instance for chaining.
     */
    removeClass(className) {
      this.elements.forEach(element => {
        element.classList.remove(className);
      });
      return this;
    }
  
    /**
     * Adds a class to the selected elements.
     * @param {string} className - The class name to add.
     * @returns {PipeQuery} - The PipeQuery instance for chaining.
     */
    addClass(className) {
      this.elements.forEach(element => {
        element.classList.add(className);
      });
      return this;
    }
  
    /**
     * Switches a class from the selected elements.
     * @param {string} fromClass - The class name to remove.
     * @param {string} toClass - The class name to add.
     * @returns {PipeQuery} - The PipeQuery instance for chaining.
     */
    switchClass(fromClass, toClass) {
      this.elements.forEach(element => {
        element.classList.remove(fromClass);
        element.classList.add(toClass);
      });
      return this;
    }
  
    /**
     * Fades in the selected elements.
     * @param {number} time - The duration of the fadeIn animation in milliseconds.
     * @returns {PipeQuery} - The PipeQuery instance for chaining.
     */
    fadeIn(time) {
      this.show();
  
      this.elements.forEach(element => {
        const oldValues = {
          transition: element.style.transition,
          opacity: element.style.opacity
        };
  
        element.style.opacity = 0;
        element.style.transition = `opacity ${time}ms ease-in-out`;
        element.offsetHeight; // Trigger a reflow to apply the transition
        element.style.opacity = 1;
  
        // Reset the values after the transition
        setTimeout(() => {
          element.style.transition = oldValues.transition;
          element.style.opacity = oldValues.opacity;
        }, time + 100);
      });
  
      return this;
    }
  
    /**
     * Fades out the selected elements.
     * @param {number} time - The duration of the fadeOut animation in milliseconds.
     * @returns {PipeQuery} - The PipeQuery instance for chaining.
     */
    fadeOut(time) {
      this.elements.forEach(element => {
        const oldValues = {
          transition: element.style.transition,
          opacity: element.style.opacity
        };
  
        element.style.opacity = 1;
        element.style.transition = `opacity ${time}ms ease-in-out`;
        element.offsetHeight; // Trigger a reflow to apply the transition
        element.style.opacity = 0;
  
        // Reset the values after the transition
        setTimeout(() => {
          element.style.transition = oldValues.transition;
          element.style.opacity = oldValues.opacity;
        }, time + 100);
      });
  
      return this;
    }
  
    /**
     * Checks if the selected elements have a specific class.
     * @param {string} className - The class name to check.
     * @returns {boolean} - true if any of the elements have the class, otherwise false.
     */
    hasClass(className) {
      return this.elements.some(element => element.classList.contains(className));
    }
  
    /**
     * Gets the number of selected elements.
     * @type {number}
     */
    get length() {
      return this.elements.length;
    }
  
    /**
     * Get the file(s) associated with the selected element(s).
     * @param {number} [index] - Optional index to retrieve a specific file.
     * @returns {File|File[]|undefined} - If index is provided, returns the file at that index; otherwise, returns an array of all files.
     */
    files(index) {
      if (this.elements.length === 0 || !this.elements[0].files) {
        return undefined;
      }
  
      if (index !== undefined) {
        if (!this.elements[0] || index >= this.elements[0].files.length) return undefined;
        return this.elements[0].files[index];
      } else {
        // Return an array of all files
        return Array.from(this.elements[0].files);
      }
    }
  
    /**
     * Perform an Ajax request.
     *
     * @param {object} options - Ajax options.
     * @param {string} options.url - The URL to send the request to.
     * @param {string} [options.method='GET'] - The request method (GET, POST, etc.).
     * @param {string} [options.contentType=false] - The content type header. Default is "false".
     * @param {boolean} [options.async=true] - Whether the request should be asynchronous.
     * @param {function} options.success - A callback function to handle a successful request.
     * @param {function} [options.error] - A callback function to handle a failed request.
     * @param {string} [options.dataType='json'] - The expected data type of the response.
     * @param {FormData} [options.data] - FormData object for handling uploads and other multipart data.
     * @param {function} [options.beforeSend] - A callback function to execute before sending the request.
     * @param {function} [options.xhr] - A callback function to track progress.
     */
    ajax(options) {
      const xhrRequest = new XMLHttpRequest();
      xhrRequest.onreadystatechange = function () {
        if (xhrRequest.status === 200 && xhrRequest.readyState === 4) {
          // If status is 200 (OK) and readyState is 4 (Finished)
          if (options.success) {
            // If a success callback is available
            let responseData = xhrRequest.response;
            if (options.dataType === "json") {
              try {
                responseData = JSON.parse(xhrRequest.responseText || "") || xhrRequest.response;
              } catch (e) {
                if (options.error) {
                  options.error(xhrRequest, "parseError", e);
                }
                return;
              }
            } else if (options.dataType === "xml") {
              // Parse to XML if the type is wrong
              if (!xhrRequest.responseXML && window.DOMParser) {
                responseData = new window.DOMParser().parseFromString(xhrRequest.response || "", "text/xml");
              } else {
                responseData = xhrRequest.responseXML;
              }
            } else {
              responseData = xhrRequest.responseText || xhrRequest.response;
            }
            options.success(responseData, xhrRequest.status, xhrRequest);
          }
        } else if (xhrRequest.readyState === 4 && options.error) {
          options.error(xhrRequest, "error");
        }
      };
  
      xhrRequest.open(options.method || "GET", options.url, options.async !== false);
  
      if (options.beforeSend) {
        options.beforeSend(xhrRequest);
      }
  
      const sendRequest = data => {
        try {
          if (data) {
            xhrRequest.send(data);
          } else {
            xhrRequest.send();
          }
        } catch (e) {
          if (options.error) {
            options.error(xhrRequest, "error sending request", e);
          }
        }
      };
  
      // Required event listeners for options.xhr
      xhrRequest.upload.addEventListener("progress", () => {});
  
      if (options.method === "POST" && options.data) {
        if (options.data) {
          // For regular FormData POST requests
          options.contentType && xhrRequest.setRequestHeader("Content-type", options.contentType);
          sendRequest(options.data);
        } else {
          // For empty POST requests
          sendRequest();
        }
      } else {
        sendRequest();
      }
  
      if (options.xhr) {
        options.xhr(xhrRequest);
      }
    }
  };
  
  },{}],6:[function(require,module,exports){
  module.exports = pipeRTCRecorder = {
  
    addPipeRTCRecorder: function (pipeElement, pipeVars, qualityProfileData) {
  
      var socket = null;
      let blockingError = false;
  
      var videoInput = null;
      var videoPlayback = null;
      var smallVideoInput;
      var pipeMediaRecorder;
      var recordingOptions = { mimeType: 'video/webm' }; //minimum viable mimeType, Firefox will use this mimeType.
      var streamExtension = "webm";
      let videoEncoding = ";codecs=h264"; // Preferred encoding
  
      // Media inputs from user
      let inputDeviceList = { audio: [], video: [] };
      let inputSelectedDevice = { audio: { deviceId: "" }, video: { deviceId: "" } };
      let inputDisconnectedDevices = { audio: [], video: [] };
      const inputDisconnectTimer = 60000; // 60 seconds
  
      /**
       * @var {boolean} - Whether the system audio is also recorded.
       */
      let hasSystemAudio = false;
  
      /**
       * @var {MediaStream} - The audio of the screen stream.
       */
      let systemAudio = undefined;
  
      /**
       * Updates the recording options according to the type.
       * @param {String} type - The type of the recording (audio or video)
       * @function
       */
      const updateRecordingOptions = type => {
        if (type === "video") {
          if (MediaRecorder.isTypeSupported('video/webm' + videoEncoding)) {
            recordingOptions = { mimeType: 'video/webm' + videoEncoding };
            streamExtension = "webm";
          } else if (MediaRecorder.isTypeSupported('video/mp4')) {
            recordingOptions = { mimeType: 'video/mp4', videoBitsPerSecond: 2500000 }; //Safari uses this mimeType.
            streamExtension = "mp4";
          } else {
            recordingOptions = { mimeType: 'video/webm' };
            streamExtension = "webm";
          }
        } else if (type === "audio") {
          //change the mime type to audio only	
          recordingOptions = { mimeType: 'audio/webm' }; //default audio mimeType for Chromium based browsers and Firefox	
          if (MediaRecorder.isTypeSupported('audio/mp4')) {
            recordingOptions = { mimeType: 'audio/mp4' }; //Safari uses this mimeType.
            streamExtension = "mp4";
          }
        }
      };
  
      updateRecordingOptions("video");
  
      // Checks if the recording is retried with a fallback. If so, some behaviors are skipped (eg: countdown timer).
      let retryRecordingWithFallback = false;
  
      //MediaRecorder timeslice param
      var timeSlice = 200;
      if (isSafariOnMac == true) {
        //issue fix for Safari on certain macOS versions
        timeSlice = 10;
      }
  
      var localStream = null;
      var wsURL = "https://" + html5Server;
  
      //navigator.getUserMedia = navigator.getUserMedia || navigator.mozGetUserMedia || navigator.webkitGetUserMedia;
  
      var lastStreamTime = 0;
      var actualStreamTime = 0;
      // var autoStopped = false; // Never read (unused)
      var timeSinceRecBtnPressed = 0;
      let streamStartTime;
      let streamTimeNoData; // Recording time with no data
  
      const IDLE = 0;
      const DISABLED = 1;
      const RECORDING = 2;
      const PLAYING = 3;
      const STOPPED = 4;
      const PAUSED = 5;
      const DISABLE_SAVE = 6;
      const ENABLE_DOWNLOAD = 7;
  
      /**
       * @typedef {Object} States
       * @property {string} INIT - Initial state.
       * @property {string} IDLE - Idle state.
       * @property {string} RECORDING - Recording state.
       * @property {string} RECORDED - Recorded state.
       * @property {string} PLAYING - Playing state.
       * @property {string} PLAYED - Played state.
       * @property {string} PAUSED - Paused state.
       */
  
      /**
       * Represents the possible valid states of the recording client.
       * @type {States}
       */
      const states = {
        INIT: "init",
        IDLE: "idle",
        RECORDING: "recording",
        RECORDED: "recorded",
        PLAYING: "playing",
        PLAYED: "played",
        PAUSED: "paused"
  
        /**
         * @var {keyof States} state - Stores the current state of the pipe recording client.
         */
      };var state = states.INIT;
  
      var cam = "";
      var mic = "";
      var micMuted = "";
      var camMuted = "";
      var camReadyState = "";
      var micReadyState = "";
      var screenReadyState = "";
      var camNumber = 0;
      var micNumber = 0;
      var sumMicLevel = 0;
      var nrOfMicLevelCalls = 0;
      var vidWidth;
      var vidHeight;
      var vidFrameRate;
  
      var soundMeter = null;
  
      //=== For Inline Recorder only ===
      var mobileCamUsed = "user";
      var micGainValue = pipeVars["mgv"] || 1;
      //========================
  
      var playStreamElapsedTime = 0;
      var actualPlaybackTime = 0;
  
      var streamElapsedTime = 0;
      var newFileName = "";
  
      var btSaveCanBeUsed = true;
  
      var totalStreamSize = 0;
      var buffer = [];
      var intermediateBuffer = [];
      var arrayOfBlobs = [];
      var bufferWasUpdated = true;
      var recordingStopped = false;
      var incomingDataHasSize = false;
  
      var initialConnectionWorked = false;
      var isFallbackConnection = false;
      var recorderDisconnected = false;
      // var rightAfterReconnect = false; // Never read (unused)
  
      let statsForNerdsOpen = false;
  
      // True if it is mobile device
      const mobile = navigator.userAgent.toLowerCase().indexOf("android") != -1 || navigator.userAgent.toLowerCase().indexOf("mac") != -1 && navigator.maxTouchPoints > 1 || navigator.userAgent.toLowerCase().indexOf("iphone") != -1;
  
      //svg Icons
      var recordIcon = '<svg style="enable-background:new 0 0 16 16;" version="1.1" width="30" height="30" viewBox="0 0 100 100" xml:space="preserve" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><circle cx="50" cy="50" r="30" fill="red" /><circle cx="50" cy="50" r="40" stroke="black" stroke-width="8" fill="none" /></svg>';
      var stopRecIcon = '<svg width="30" height="30" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><g><circle id="svg_2" fill="none" stroke-width="8" stroke="black" r="40" cy="50" cx="50"/><rect rx="8" id="svg_3" height="46" width="46" y="27" x="27" fill-opacity="null" stroke-opacity="null" stroke-width="null" stroke="null" fill="red"/></g></svg>';
      var playIcon = '<svg enable-background="new 0 0 512 512" height="30" viewBox="0 0 512 512" width="30" xmlns="http://www.w3.org/2000/svg"><path d="m405.2 232.9-278.4-165.7c-3.4-2-6.9-3.2-10.9-3.2-10.9 0-19.8 9-19.8 20h-.1v344h.1c0 11 8.9 20 19.8 20 4.1 0 7.5-1.4 11.2-3.4l278.1-165.5c6.6-5.5 10.8-13.8 10.8-23.1s-4.2-17.5-10.8-23.1z"/></svg>';
      var pauseIcon = '<svg height="30px" style="enable-background:new 0 0 512 512;" version="1.1" viewBox="0 0 512 512" width="30px" xml:space="preserve" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><g><path d="M224,435.8V76.1c0-6.7-5.4-12.1-12.2-12.1h-71.6c-6.8,0-12.2,5.4-12.2,12.1v359.7c0,6.7,5.4,12.2,12.2,12.2h71.6   C218.6,448,224,442.6,224,435.8z"/><path d="M371.8,64h-71.6c-6.7,0-12.2,5.4-12.2,12.1v359.7c0,6.7,5.4,12.2,12.2,12.2h71.6c6.7,0,12.2-5.4,12.2-12.2V76.1   C384,69.4,378.6,64,371.8,64z"/></g></svg>';
      var microphoneIcon = '<svg height="30px" style="enable-background:new 0 0 512 512;" version="1.1" viewBox="120 0 273 512" width="16px" xml:space="preserve" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><g><path d="M256,353.5c43.7,0,79-37.5,79-83.5V115.5c0-46-35.3-83.5-79-83.5c-43.7,0-79,37.5-79,83.5V270   C177,316,212.3,353.5,256,353.5z"/><path d="M367,192v79.7c0,60.2-49.8,109.2-110,109.2c-60.2,0-110-49-110-109.2V192h-19v79.7c0,67.2,53,122.6,120,127.5V462h-73v18   h161v-18h-69v-62.8c66-4.9,117-60.3,117-127.5V192H367z"/></g></svg>';
      var microphoneDisabledIcon = '<svg height="30px" style="enable-background:new 0 0 512 512;" version="1.1" viewBox="120 0 273 512" width="16px" xml:space="preserve" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><g><path style="fill:red" d="M256,353.5c43.7,0,79-37.5,79-83.5V115.5c0-46-35.3-83.5-79-83.5c-43.7,0-79,37.5-79,83.5V270   C177,316,212.3,353.5,256,353.5z"/><path d="M367,192v79.7c0,60.2-49.8,109.2-110,109.2c-60.2,0-110-49-110-109.2V192h-19v79.7c0,67.2,53,122.6,120,127.5V462h-73v18   h161v-18h-69v-62.8c66-4.9,117-60.3,117-127.5V192H367z"/></g></svg>';
      var switchCamIcon = '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="15pt" height="15pt" viewBox="0 0 15 15" version="1.1"><g id="surface1"><path style=" stroke:none;fill-rule:nonzero;fill:#7a7a7a;fill-opacity:1;" d="M 5.574219 1.917969 C 5.351562 1.976562 5.15625 2.074219 4.972656 2.210938 C 4.757812 2.375 4.699219 2.457031 4.484375 2.886719 L 4.296875 3.261719 L 2.90625 3.277344 C 1.371094 3.292969 1.441406 3.285156 1.054688 3.488281 C 0.796875 3.621094 0.472656 3.957031 0.34375 4.226562 C 0.144531 4.632812 0.148438 4.472656 0.148438 8.203125 C 0.148438 11.453125 0.152344 11.570312 0.207031 11.785156 C 0.371094 12.425781 0.84375 12.902344 1.488281 13.066406 C 1.707031 13.121094 1.828125 13.121094 7.496094 13.121094 C 13.167969 13.121094 13.289062 13.121094 13.507812 13.066406 C 14.167969 12.898438 14.664062 12.382812 14.804688 11.730469 C 14.867188 11.433594 14.867188 4.9375 14.804688 4.644531 C 14.679688 4.054688 14.191406 3.527344 13.597656 3.332031 C 13.511719 3.304688 13.125 3.289062 12.089844 3.277344 L 10.699219 3.261719 L 10.507812 2.878906 C 10.300781 2.460938 10.179688 2.308594 9.898438 2.125 C 9.808594 2.066406 9.652344 1.988281 9.554688 1.953125 L 9.378906 1.886719 L 7.554688 1.878906 C 6.015625 1.875 5.710938 1.878906 5.574219 1.917969 Z M 9.320312 2.859375 C 9.402344 2.894531 9.488281 2.949219 9.511719 2.980469 C 9.542969 3.011719 9.664062 3.25 9.789062 3.507812 C 10.03125 4.011719 10.109375 4.113281 10.296875 4.164062 C 10.371094 4.183594 10.898438 4.195312 11.835938 4.195312 C 13.410156 4.195312 13.417969 4.195312 13.632812 4.378906 C 13.691406 4.433594 13.78125 4.546875 13.828125 4.628906 L 13.914062 4.785156 L 13.921875 8.125 C 13.929688 11.964844 13.945312 11.671875 13.671875 11.949219 C 13.390625 12.230469 13.996094 12.203125 7.496094 12.203125 C 1 12.203125 1.605469 12.230469 1.324219 11.949219 C 1.046875 11.671875 1.066406 11.964844 1.074219 8.125 L 1.082031 4.785156 L 1.167969 4.628906 C 1.214844 4.546875 1.304688 4.433594 1.363281 4.378906 C 1.578125 4.195312 1.589844 4.195312 3.148438 4.195312 C 4.011719 4.195312 4.605469 4.183594 4.683594 4.164062 C 4.757812 4.148438 4.851562 4.101562 4.894531 4.058594 C 4.941406 4.015625 5.078125 3.769531 5.203125 3.511719 C 5.332031 3.25 5.453125 3.011719 5.484375 2.980469 C 5.507812 2.949219 5.597656 2.894531 5.675781 2.859375 L 5.820312 2.789062 L 9.175781 2.789062 Z M 9.320312 2.859375 "/><path style=" stroke:none;fill-rule:nonzero;fill:#7a7a7a;fill-opacity:1;" d="M 6.890625 4.699219 C 6.4375 4.785156 5.941406 5 5.582031 5.269531 C 5.363281 5.433594 4.984375 5.828125 4.851562 6.035156 C 4.683594 6.292969 4.519531 6.636719 4.441406 6.910156 C 4.355469 7.207031 4.351562 7.273438 4.425781 7.429688 C 4.523438 7.644531 4.761719 7.742188 4.988281 7.65625 C 5.152344 7.59375 5.242188 7.472656 5.300781 7.242188 C 5.511719 6.421875 6.179688 5.792969 7.019531 5.609375 C 7.324219 5.546875 7.816406 5.574219 8.113281 5.671875 C 8.394531 5.761719 8.703125 5.929688 8.875 6.085938 L 9.003906 6.203125 L 8.699219 6.511719 L 8.386719 6.824219 L 9.664062 7.164062 C 10.367188 7.351562 10.949219 7.5 10.953125 7.492188 C 10.960938 7.488281 10.8125 6.914062 10.625 6.21875 C 10.441406 5.523438 10.285156 4.949219 10.285156 4.941406 C 10.28125 4.9375 10.140625 5.070312 9.972656 5.238281 L 9.664062 5.542969 L 9.492188 5.398438 C 9.132812 5.09375 8.6875 4.867188 8.214844 4.742188 C 7.898438 4.65625 7.214844 4.636719 6.890625 4.699219 Z M 6.890625 4.699219 "/><path style=" stroke:none;fill-rule:nonzero;fill:#7a7a7a;fill-opacity:1;" d="M 9.9375 8.304688 C 9.800781 8.402344 9.742188 8.492188 9.695312 8.6875 C 9.585938 9.105469 9.292969 9.570312 8.96875 9.839844 C 8.546875 10.1875 8.097656 10.34375 7.539062 10.347656 C 7.140625 10.347656 6.878906 10.289062 6.5625 10.128906 C 6.371094 10.03125 6.003906 9.777344 6.003906 9.742188 C 6.003906 9.730469 6.144531 9.582031 6.3125 9.414062 L 6.617188 9.109375 L 6.492188 9.074219 C 5.242188 8.738281 4.039062 8.421875 4.035156 8.425781 C 4.027344 8.433594 4.648438 10.773438 4.703125 10.953125 C 4.714844 10.996094 4.773438 10.953125 5.027344 10.695312 L 5.335938 10.390625 L 5.59375 10.59375 C 6.949219 11.683594 8.972656 11.433594 10.035156 10.042969 C 10.472656 9.46875 10.726562 8.6875 10.550781 8.453125 C 10.449219 8.316406 10.316406 8.242188 10.167969 8.242188 C 10.074219 8.242188 10.003906 8.261719 9.9375 8.304688 Z M 9.9375 8.304688 "/></g></svg>';
      const audioOnlySVG = '<svg height="100px" id="pipeAudioOnly-' + pipeElement + '" class="pipeMiddleCentered" style="enable-background:new 0 0 512 512;z-index: 1;fill:#7a7a7a;" version="1.1" viewBox="0 0 512 512" width="100px" xml:space="preserve" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"<g><path class="fillColor" d="M256.4,32c-35.1,0.1-65.8,23.2-76.8,59.3c-5.6,18.5-3.5,44.8-1.2,54.5c2.3,9.7,7.3,19.9,13.2,28.3   c2.8,4.2,6.7,7.4,11.2,9.2c0.6,0.3,1.3,0.5,2,0.8c3.3,1.1,6.5,2.2,10.1,3.1c11.8,3,27.1,4.7,41.1,4.8v0c0,0,0.6,0,0.7,0   c0.3,0,0.3,0,1.3,0v-0.1c14-0.1,27.3-1.7,39.1-4.8c3.6-0.9,6.9-2,10.2-3.1c0.7-0.2,1.3-0.5,1.9-0.8c4.5-1.8,8.4-5,11.2-9.2   c5.9-8.4,10.8-18.6,13.2-28.3c2.3-9.7,4.4-36-1.2-54.5C321.4,55.2,291.6,32.1,256.4,32z"/><path class="fillColor" d="M295.3,201.1c-0.4,0-0.7,0-1.1,0.1c-0.6,0.1-1.3,0.3-1.9,0.4c-2,0.4-4.1,0.8-6.1,1.2c-9.2,1.5-18.9,2.3-29,2.4   c-10.1-0.1-22.3-0.9-31-2.4c-2.1-0.4-4.2-0.8-6.2-1.2c-0.6-0.1-1.3-0.3-1.9-0.4c-0.4-0.1-0.8-0.1-1.1-0.1c-6.1,0-11,5.3-11.2,11.9   c0.1,0.8,0.2,1.6,0.2,2.4c4.8,67.2,16.8,240.7,18.2,252c0,0,2.8,12.7,32.1,12.6c0,0,0,0,0,0c29.2,0.1,32.1-12.6,32.1-12.6   c1.4-11.3,13.4-184.8,18.2-252c0-0.8,0.1-1.6,0.2-2.4C306.3,206.4,301.4,201.1,295.3,201.1z M266,281.7c0,6-4.5,10.9-10,10.9   c-5.5,0-10-4.9-10-10.9V249c0-6,4.5-10.9,10-10.9c5.5,0,10,4.9,10,10.9V281.7z"/></g></svg>';
      const saveIcon = '<svg height="30" version="1.1" width="24" viewBox="2.8 -0.4 19 24" xmlns="http://www.w3.org/2000/svg" xmlns:cc="http://creativecommons.org/ns#" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"><g transform="translate(0 -1028.4)"><path d="m3 1037.4v2 2 6c0 1.1 0.8954 2 2 2h14c1.105 0 2-0.9 2-2v-6-2-2h-18z" fill="#2980b9"/><path d="m5 3c-1.1046 0-2 0.8954-2 2v2 2 1 2 6c0 1.105 0.8954 2 2 2h14c1.105 0 2-0.895 2-2v-6-2-1-2-1l-3-3h-1-2-10z" fill="#3498db" transform="translate(0 1028.4)"/><path d="m6 3v1 1 2c0 1.1046 0.8954 2 2 2h1 4 2 1c1.105 0 2-0.8954 2-2v-1.8438-0.1562-1-1h-12z" fill="#2980b9" transform="translate(0 1028.4)"/><path d="m8 1041.4c-1.1046 0-2 0.9-2 2v1.8 3.2h12v-3.2-1.8c0-1.1-0.895-2-2-2h-3-5z" fill="#ecf0f1"/><rect fill="#bdc3c7" height="1" width="12" x="6" y="1048.4"/><path d="m7 1031.4v1 2c0 1.1 0.8954 2 2 2h1 4 1c1.105 0 2-0.9 2-2v-1.9-0.1-1h-10z" fill="#ecf0f1"/><path d="m8 4v2c0 0.5523 0.4477 1 1 1h1 1c0.552 0 1-0.4477 1-1v-2h-2-2z" fill="#95a5a6" transform="translate(0 1028.4)"/><g fill="#bdc3c7"><rect height="1" transform="translate(0 1028.4)" width="8" x="8" y="15"/><rect height="1" width="8" x="8" y="1045.4"/><rect height="1" width="4" x="8" y="1031.4"/></g></g></svg>';
      const downloadIcon = '<svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" id="Layer_1" viewBox="0 0 1000 1000" style="scale:1.2" xml:space="preserve"><style type="text/css">.st0{fill-rule:evenodd;clip-rule:evenodd;fill:#13104C;}.st1{fill:#13104C;}</style><g><path class="st1" d="M525.93,214.81c0-14.32-11.61-25.93-25.93-25.93c-14.32,0-25.93,11.61-25.93,25.93V396.3   c0,14.32,11.61,25.93,25.93,25.93c14.32,0,25.93-11.61,25.93-25.93V214.81z"/><path class="st1" d="M834.83,640.58c2.21-27,2.21-60.54,2.21-103.13c0-10.7,0-16.05-0.53-20.55c-4.18-35.8-32.42-64.04-68.22-68.22   c-4.5-0.53-9.85-0.53-20.55-0.53H525.93v118.89l59.45-59.45c10.12-10.12,26.54-10.12,36.66,0c10.12,10.12,10.12,26.54,0,36.66   l-103.7,103.7c-10.12,10.12-26.54,10.12-36.66,0l-103.7-103.7c-10.12-10.12-10.12-26.54,0-36.66c10.12-10.12,26.54-10.12,36.66,0   l59.45,59.45V448.15H252.26c-10.7,0-16.05,0-20.55,0.53c-35.8,4.18-64.04,32.42-68.22,68.22c-0.53,4.5-0.53,9.85-0.53,20.55   c0,42.59,0,76.13,2.21,103.13c2.25,27.54,6.92,50.54,17.57,71.44c17.4,34.15,45.16,61.91,79.31,79.31   c20.9,10.65,43.9,15.32,71.44,17.58c27,2.21,60.54,2.21,103.13,2.21h126.75c42.59,0,76.13,0,103.13-2.21   c27.54-2.25,50.54-6.92,71.44-17.58c34.15-17.4,61.91-45.16,79.31-79.31C827.91,691.12,832.58,668.12,834.83,640.58z"/></g></svg>';
      const cameraIcon = (fill = "#000000") => '<svg height="30px" viewBox="0 0 20 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M5.5 7H15.5C16.3284 7 17 7.67157 17 8.5V10.5L19.2764 9.3618C19.6088 9.19558 20 9.43733 20 9.80902V15.2785C20 15.6276 19.6513 15.8692 19.3244 15.7467L17 14.875V16.5C17 17.3284 16.3284 18 15.5 18H5.5C4.67157 18 4 17.3284 4 16.5V8.5C4 7.67157 4.67157 7 5.5 7Z" fill="' + fill + '"/></svg>';
  
      const saveBtn = '<button class="pipeMobFriendlyIconBtn">' + saveIcon + '<span>' + saveBtnTxt + '</span></button>';
  
      //counters
      var recordCounter = null;
      var playStreamCounter = null;
      var streamCounter = null;
  
      var nextSliceIndex = 0;
  
      var connectionCounter = 0;
  
      //vars for gUM time to action
      var ttaInit;
      var ttaResult;
  
      //vars for cleanup
      var pipeRecorderRemoved = false;
      var intervals = [];
  
      //var lang = new Array();
  
      //needed for initial connection to check whitelisted hosts
      var accountHashOnConnect = pipeVars["accountHash"];
      var environmentIdOnConnect = pipeVars["eid"] ? pipeVars["eid"] : '1';
      const invalidHostError = "The Pipe recorder is not allowed to record from this host.";
  
      //init WSS
      var wssOptions = {
        reconnectionAttempts: 30,
        rememberUpgrade: true,
        transports: ['websocket'],
        timeout: 10000,
        query: 'v=2.0&ext=' + streamExtension + '&srec=' + recordingScreen + '&accountHash=' + accountHashOnConnect + '&environmentId=' + environmentIdOnConnect + '&build=' + pipeVars["build"] + "&pipeRecorderId=" + pipeVars["recorderId"]
      };
  
      socket = io(wsURL, wssOptions);
  
      //========== Screen capture ===============
      // var request = { sources: ['window', 'screen', 'tab'] }; // Never read (unused)
      //====================================
  
      //create video interface
      var menuH = 30;
      var extraGap = 0;
      var cornerRadiusNoMenu = 0;
  
      //backward compatibility for showMenu
      if (pipeVars["showMenu"] == "true" || pipeVars["showMenu"] == undefined) {
        pipeVars["showMenu"] = 1;
      } else if (pipeVars["showMenu"] == "false") {
        pipeVars["showMenu"] = 0;
      }
      //============
  
      //set noise suppression
      var noiseSuppressionVal = true;
      if (pipeVars["ns"] != undefined && pipeVars["ns"] == 0) {
        noiseSuppressionVal = false;
      }
  
      if (pipeVars["showMenu"] == 0) {
        menuH = 0;
        extraGap = 30;
        cornerRadiusNoMenu = cornerRadius;
      }
  
      /**
       * Whether or not the timer is switched to size display.
       * @type {Boolean}
       */
      let timerSwitchToSize = false;
  
      /**
       * Converts a bytes value to a readable value based on size (ex: MiB, GiB).
       * @param {number} value - The value in bytes to be converted.
       * @returns {string} - The formatted readable value.
       * @function
       */
      const bytesToReadableValue = value => {
        if (isNaN(value) || value < 0) return;
  
        const bytesInOneMiB = 1024 * 1024;
        const bytesInOneGiB = bytesInOneMiB * 1024;
  
        if (value < bytesInOneGiB) {
          // Convert to MiB with one decimal point
          const valueInMiB = value / bytesInOneMiB;
          return `${valueInMiB.toFixed(1)}MiB`;
        } else {
          // Convert to GiB with one decimal point
          const valueInGiB = value / bytesInOneGiB;
          return `${valueInGiB.toFixed(1)}GiB`;
        }
      };

      /**
       * Adds an icon at the beginning (left) of the timer.
       * @param {String} type - The type of icon to add: "REC", "PLAY", "PAUSE", "NONE";
       * @function
       */
      const addIconToTimer = type => {
        const timerToUpdate = document.getElementById("pipeCounter-" + pipeElement);
        const possibleIcons = new Set(["REC", "PLAY", "PAUSE", "NONE"]);
        const pipeTimerIcon = document.getElementById("pipeTimerIcon-" + pipeElement);
        const popup = document.getElementById('recordingPopup'); // Get the popup element

        if (!timerToUpdate || !pipeTimerIcon || !type || !possibleIcons.has(type)) return;

          
      // Show or hide the recording popup based on the type
      if (type === "REC") {
        popup.style.display = 'block'; // Show the popup when the type is REC
      } else {
        popup.style.display = 'none'; // Hide the popup when the type is not REC
      }
        switch (type) {
          case "REC":
            pipeTimerIcon.innerHTML = '<div class="pipeRecIcon"></div>';
            break;
          case "PLAY":
            pipeTimerIcon.innerHTML = '<div class="pipePlayIcon"></div>';
            break;
          case "PAUSE":
            pipeTimerIcon.innerHTML = '<div class="pipePauseIcon"></div>';
            break;
          case "NONE":
          default:
            pipeTimerIcon.innerHTML = "";
            break;
        }
      };
  
      /**
       * Updates the timer and applies the appropriate styling.
       * @param {String} activeDigits - The digits that get updated.
       * @param {String} fixedDigits - The digits after the slash (if available).
       * @function
       */
      const updateTimer = (activeDigits, fixedDigits) => {
        const timerToUpdate = document.getElementById("pipeCounter-" + pipeElement);
        if (!timerToUpdate || !activeDigits) return;
  
        // Add span if not existing. Return element to be updated
        const addIfNotExisting = (id, className) => {
          let element = document.getElementById(id + "-" + pipeElement);
          if (!element) {
            element = document.createElement("span");
            if (className) element.className = className;
            element.id = id + "-" + pipeElement;
            timerToUpdate.appendChild(element);
          }
          return element;
        };
  
        // ICON
        addIfNotExisting("pipeTimerIcon", "pipeTimerIcon");
  
        // DYNAMIC TIMER
        addIfNotExisting("pipeTimerDigits").innerText = activeDigits;
  
        // FIXED DIGITS
        if (!fixedDigits) addIfNotExisting("pipeFixedTimerDigits").innerText = "";else addIfNotExisting("pipeFixedTimerDigits").innerText = " / " + fixedDigits;
      };
  
      //Audio meter & input select menu
      var micMeter = "";
      var camButton = "";
      if (pipeVars["showMenu"] == 1) {
        // Microphone meter HTML
        micMeter = `
          <div id="pipeMicContainer-${pipeElement}" class="pipeMicContainer" title="${micIconTxt}">
            <div id="pipeNotificationaudio-${pipeElement}" class="pipeNotification audio" style="display:none; border: 2px solid ${menuCol};"></div>
            <div style="vertical-align:initial;display:inline-block; background:${menuCol}" class="pipeInputSettingsButton" id="pipeMicIcon-${pipeElement}">${microphoneIcon}</div>
            <div class="pipeMeter-container">
              <div class="pipeMeter" id="audioMeter-${pipeElement}"></div>
            </div>
          </div>
        `;
  
        // Camera button HTML
        camButton = pipeVars["ao"] === 1 || recordingScreen ? '' : `
          <div id="pipeCamContainer-${pipeElement}" class="pipeCamContainer">
            <div id="pipeNotificationvideo-${pipeElement}" class="pipeNotification video" style="display:none; border: 2px solid ${menuCol};"></div>
            <div style="vertical-align:initial;display:inline-block; background:${menuCol}" class="pipeInputSettingsButton" id="pipeCamIcon-${pipeElement}">${cameraIcon()}</div>
          </div>
        `;
      }
  
      // Progress bar for video playback
      const playbackProgressBar = `
        <div id="pipeProgressBarBorder-${pipeElement}" style="display:none;width:100%;position:absolute;bottom:${30 - extraGap}px;overflow:hidden;" class="pipePlaybackBarBorder">
          <div id="pipeProgressBar-${pipeElement}" style="width:0%;height:2px;background:#ff0000;"></div>
        </div>
      `;
  
      // Background blur element
      const bgBlurElement = `
        <div id="pipeEffectSwitch-${pipeElement}" class="pipeEffectSwitch pipeBetaFeature">
          <span>Blur background</span>
          <input id="pipeBlurBgCheck-${pipeElement}" type="checkbox">
          <div></div>
        </div>
      `;
  
      // Video effects array - contains all the enabled video effects elements
      const VFXarray = [];
  
      // Populate video effects array
      pipeVars["bgblur"] == 1 && VFXarray.push(bgBlurElement);
  
      // Video effects
      const VFXelement = VFXarray.length === 0 ? "" : `
        <div class="pipeMediaMenuTitle">
          <p>Effects</p>
          <p></p>
        </div>
        <div class="pipeMediaMenuEffects">
          ${VFXarray.join("")}
        </div>
      `;
  
      // Input media device select menu - translate to handle menu gap
      const inputMediaSelectMenu = `
        <div class="pipeMediaSelectMenu hidden" style="display:none; background-color:${menuCol}; translate: 0 -${extraGap > 0 ? extraGap + 10 : 30 - extraGap}px" id="pipeMediaSelectMenu-${pipeElement}">
          <div class="pipeMediaMenuCateg" id="pipeMediaMenuVideo-${pipeElement}">
            <div class="pipeMediaMenuTitle">
              <p id="inputCamTitle-${pipeElement}">${inputCamTitleTxt}</p>
              <p></p>
            </div>
            <ul class="pipeMediaMenuList" id="pipeVidSelect-${pipeElement}"></ul>
            ${VFXelement}
          </div>
          <div class="pipeMediaMenuCateg" id="pipeMediaMenuAudio-${pipeElement}">
            <div class="pipeMediaMenuTitle">
              <p id="inputMicTitle-${pipeElement}">${inputMicTitleTxt}</p>
              <p></p>
            </div>
            <ul class="pipeMediaMenuList" id="pipeMicSelect-${pipeElement}"></ul>
          </div>
        </div>
      `;
  
      const switchCamBtn = `
        <div id="pipeSwitchCamContainer-${pipeElement}" style="position:absolute;top:10px;left:calc(${100}% - ${30}px);z-index:1;">
          <div id="pipeSwitchCam-${pipeElement}" class="pipeBtn">${switchCamIcon}</div>
        </div>
      `;
  
      // Powered by Pipe link
      const poweredByHTML = showPoweredBy == 0 ? "" : `<p id="pipeClickPowered-${pipeElement}" title="Pipe Video Recorder" style="position:absolute;width:100%;bottom:0px;text-align:center;bottom:${40 - extraGap}px;height:0;text-decoration:underline;font-family:sans-serif;font-size:10px; color:#ffffff;cursor: pointer;z-index:1;" tabindex="0">Powered by Pipe</p>`;
  
      // The main pipe recording client HTML
      const pipeRecMainHTML = `
        <div id="pipeVrec-${pipeElement}" style="position:relative;margin:0;width:${pipeVars["size"]["width"]};height:${pipeVars["size"]["height"]}px;display:flex;flex-direction:column;line-height:0;">
          ${switchCamBtn}
          <video id="pipeSmallVideo-${pipeElement}" autoplay playsinline width="${100}%" height="${pipeVars["size"]["height"] - menuH}px"></video>
          <video id="pipeVideoInput-${pipeElement}" autoplay playsinline width="${100}%" height="${pipeVars["size"]["height"] - menuH}px"></video>
          <video id="pipeVideoPlayback-${pipeElement}" autoplay playsinline width="${100}%" height="${pipeVars["size"]["height"] - menuH}px"></video>
          ${poweredByHTML}
          ${playbackProgressBar}
          <div id="pipeCounter-${pipeElement}" class="pipeTimer"></div>
          <div id="pipeMenu-${pipeElement}" style="width:${100}%;height:30px;background-color:${menuCol};border-bottom-left-radius:${cornerRadius}px;border-bottom-right-radius:${cornerRadius}px;text-align:initial;">
            <div id="pipeRec-${pipeElement}" class="pipeBtn" title="${recBtnTxt}" tabindex="0">${recordIcon}</div>
            <div id="pipePlay-${pipeElement}" class="pipeBtn" title="${playBtnTxt}" tabindex="0">${playIcon}</div>
            ${micMeter}
            ${camButton}
          </div>
          ${inputMediaSelectMenu}
        </div>
      `;
  
      // Insert the Pipe recorder into DOM
      pq.$("#" + pipeElement).html(pipeRecMainHTML);
  
      // Add event listeners for powered by element if needed
      // No check for "showPoweredBy != 0" is needed because PipeQuery will only add the event listeners if the elements exist in the page 
      pq.$("#pipeClickPowered-" + pipeElement).click(refPipe).keydown(function (event) {
        if (event.which == 13) {
          event.preventDefault();
          refPipe();
        }
      });
  
      if (pipeVars["timertype"] == 1) {
        // Count-down timer
        updateTimer(digits(pipeVars["mrt"]));
      } else {
        // Count-up timer
        updateTimer("00:00", digits(pipeVars["mrt"]));
      }
  
      // Click event listener for timer - switch from timer to size display.
      pq.$("#pipeCounter-" + pipeElement).click(() => {
        // Do not switch timer display in playback mode
        if (state === states.PLAYING || state === states.PAUSED) return;
  
        timerSwitchToSize = !timerSwitchToSize;
  
        // Calculate the total size of the recording
        const totalRecordingSize = state !== states.RECORDING ? recordedChunks.reduce((total, chunk) => total + chunk.size, 0) || 0 // If not actively recording, take size from memory.
        : totalStreamSize; // If recording, take size from current recording.
  
        if (timerSwitchToSize) {
          updateTimer(bytesToReadableValue(totalRecordingSize), bytesToReadableValue(pipeVars["recordingSizeLimit"]));
        } else {
          if (pipeVars["timertype"] == 1) {
            // Count-down timer
            updateTimer(digits(pipeVars["mrt"] - lastStreamTime));
          } else {
            // Count-up timer
            updateTimer(digits(lastStreamTime), digits(pipeVars["mrt"]));
          }
        }
      });
  
      // Variable that holds info about which input menu is currently open
      let inputMenuCurrentlyOpen = "";
  
      /**
       * 
       * @param {String} type - Type of menu (audio or video)
       * @param {Boolean} [force=false] - Forces the toggle even if select button is not active
       * @function 
       */
      function toggleInputMenu(type, force = false) {
        // If recording -> return
        if (!force && state === states.RECORDING) return;
  
        // If incorrect type
        if (type !== "audio" && type !== "video") return;
  
        // If select button is not active
        if (!force && inputDeviceList[type].length === 0 && inputDisconnectedDevices[type].length === 0) return;
  
        // Remove notification
        pq.$("#pipeNotification" + type + "-" + pipeElement).css("display", "none");
  
        // Populate device selector
        inputMenuCurrentlyOpen !== type && populateInputSelectList(type);
  
        const selectMenu = document.getElementById("pipeMediaSelectMenu-" + pipeElement);
  
        // Return if menu element is not available
        if (!selectMenu) return;
  
        // Open currently closed menu
        inputMenuCurrentlyOpen === "" && selectMenu.classList.remove('hidden');
  
        // For currently selected button
        const currentlySelectedBtn = type === "audio" ? "Mic" : "Cam";
  
        // Remove "selected" from other device selector buttons first
        pq.$(".pipeInputSettingsButton").removeClass("selected");
  
        // Close currently open menu
        if (inputMenuCurrentlyOpen === type) {
          selectMenu.classList.add('hidden');
          inputMenuCurrentlyOpen = "";
          pq.$("#pipe" + currentlySelectedBtn + "Icon-" + pipeElement).removeClass("selected");
        } else {
          inputMenuCurrentlyOpen = type;
          pq.$("#pipe" + currentlySelectedBtn + "Icon-" + pipeElement).addClass("selected");
        }
      }
  
      // Add click event listener to camera and mic for opening the input select menu #pipeMediaSelectMenu
      pq.$("#pipeMicContainer-" + pipeElement).click(() => {
        toggleInputMenu("audio");
      });
  
      pq.$("#pipeCamContainer-" + pipeElement).click(() => {
        toggleInputMenu("video");
      });
  
      // Add event listeners for seek functionality - Working on both desktop and mobile
      const pipeProgressBar = document.getElementById('pipeProgressBarBorder-' + pipeElement);
      let progressBarIsDragging = false;
      let playbackSeekPosition = 0;
  
      if (mobile) {
        // Mobile
        pq.$('#pipeProgressBarBorder-' + pipeElement).on("touchstart", handleProgressBarTouchStart).on("touchmove", handleProgressBarTouchMove).switchClass("pipePlaybackBarBorder", "pipePlaybackBarBorderMobile");
      } else {
        pq.$('#pipeProgressBarBorder-' + pipeElement).on("mousedown", handleProgressBarDragStart).on("mousemove", handleProgressBarDrag);
      }
  
      //check if both requirements are met before triggering onReadyToRecord()
      pq.$("#" + pipeElement).on("pipeGotStream pipeGotConnection", function (event) {
        if (localStream != null && initialConnectionWorked == true) {
          //event API call
          PipeSDK.recorders[pipeElement].onReadyToRecord(pipeElement, "HTML5");
        }
      });
  
      //Check if we need to enable the camera switch button
      pq.$("#pipeSwitchCam-" + pipeElement).hide();
  
      if (("getUserMedia" in navigator || "mediaDevices" in navigator && "getUserMedia" in navigator.mediaDevices) && mobile) {
        if (typeof MediaRecorder === "function") {
          pq.$("#pipeSwitchCam-" + pipeElement).show();
        }
      }
  
      //check mirroring
      //pipeVars["mv"] = 0;
      if (pipeVars["mv"] == 1) {
        pq.$('#pipeVideoInput-' + pipeElement).attr("class", "pipeMirrored");
        pq.$('#pipeSmallVideo-' + pipeElement).attr("class", "pipeSmallMirrored");
      } else {
        pq.$('#pipeVideoInput-' + pipeElement).attr("class", "pipeNormal");
        pq.$('#pipeSmallVideo-' + pipeElement).attr("class", "pipeSmallNormal");
      }
      //custom style for elements
      pq.$('#pipeVideoPlayback-' + pipeElement).attr("class", "pipeNormal");
      document.getElementById("pipeVideoPlayback-" + pipeElement).removeAttribute("style");
  
      document.getElementById("pipeVideoInput-" + pipeElement).removeAttribute("style");
      pq.$("#pipeVideoInput-" + pipeElement + " " + "#pipeVideoPlayback-" + pipeElement).css("borderTopLeftRadius", cornerRadius + "px").css("borderTopRightRadius", cornerRadius + "px").css("borderBottomLeftRadius", cornerRadiusNoMenu + "px").css("borderBottomRightRadius", cornerRadiusNoMenu + "px");
  
      pq.$("#pipeVideoPlayback-" + pipeElement).css("position", "absolute").css("left", "0px").css("top", "0px");
  
      // Set a minimum height for the recorder
      pq.$("#pipeVideoInput-" + pipeElement).css("minHeight", pipeVars["size"]["height"] - menuH + "px");
      pq.$("#pipeVideoPlayback-" + pipeElement).css("minHeight", pipeVars["size"]["height"] - menuH + "px");
  
      // Add custom style to pipeVrec so that line-height is reset for all children and the text looks right
      const pipeVrecStyle = document.createElement("style");
      pipeVrecStyle.textContent = "#pipeVrec-" + pipeElement + " > * { line-height: 1.2; }";
      document.head.appendChild(pipeVrecStyle);
  
      pq.$("#pipeVideoInput-" + pipeElement).prop('muted', true);
  
      pq.$("#pipeVideoPlayback-" + pipeElement).hide();
  
      pq.$("#pipeSmallVideo-" + pipeElement).prop('muted', true).hide();
  
      //create message overlay
      var msgDiv = document.createElement("div");
      msgDiv.id = 'pipeMsgOverlay-' + pipeElement;
      msgDiv.className = 'pipeMsgOverlay';
      document.getElementById('pipeVrec-' + pipeElement).insertBefore(msgDiv, document.getElementById('pipeVrec-' + pipeElement).firstChild);
      pq.$("#pipeMsgOverlay-" + pipeElement).hide()
      //custom style for overlay message
      .css("top", (pipeVars["size"]["height"] - 50) / 2 + "px")
      // Center overlay message regardless of the recorder size
      .css("left", "50%").css("transform", "translateX(-50%)")
      // Set the height to match the content and add small padding for width
      .css("height", "max-content").css("paddingInline", "20px").css("maxWidth", "calc(100% - 10px)");
  
      if (pipeVars["downloadbtn"] != 0) {
        pq.$("#pipeMenu-" + pipeElement).append('<div id="pipeDownload-' + pipeElement + '" class="pipeBtn" title="' + downloadText + '" tabindex="0">' + downloadIcon + '</div>');
      }
  
      if (pipeVars["asv"] == 0) {
        pq.$("#pipeMenu-" + pipeElement).append('<div id="pipeSaveVideo-' + pipeElement + '" class="pipeBtnOff" title="' + saveBtnTxt + '" tabindex="0">' + saveBtn + '</div>');
      }
  
      videoInput = document.getElementById('pipeVideoInput-' + pipeElement);
      videoPlayback = document.getElementById('pipeVideoPlayback-' + pipeElement);
  
      // Stats for nerds
      let recordedChunks = [];
  
      const statsForNerdsRecordingSize = (bytes = totalStreamSize) => {
        if (isNaN(bytes) || bytes < 0) return;
        const bytesInOneMiB = 1024 * 1024;
        const valueInMiB = bytes / bytesInOneMiB;
        const sizeToDisplay = valueInMiB.toFixed(1) + "MiB (" + bytes + " bytes)";
        return sizeToDisplay;
      };
  
      const statsForNerdsCurrOptimRes = (recordingStream = localStream) => {
        if (!recordingStream) return;
        const videoTrack = recordingStream.getVideoTracks()[0];
        if (!videoTrack) return;
        const settings = videoTrack.getSettings();
        const finalString = settings.width + "x" + settings.height + "@" + settings.frameRate + " / " + vidWidth + "x" + vidHeight + "@" + vidFrameRate;
        pq.$("#currOptimRes-" + pipeElement).text(finalString);
      };
  
      const statsForNerdsCreateDownloadVideo = () => {
        const blob = new Blob(recordedChunks, { type: recordingOptions.mimeType });
        const url = URL.createObjectURL(blob);
  
        const downloadLink = document.createElement('a');
        downloadLink.href = url;
        downloadLink.download = newFileName + "." + streamExtension;
        const linkText = document.createTextNode(" Download ");
        downloadLink.appendChild(linkText);
  
        document.getElementById("totalStreamSize-" + pipeElement).appendChild(downloadLink);
      };
  
      // Stats for nerds window
      const statsForNerdsWindow = document.createElement("div");
      statsForNerdsWindow.id = "statsForNerds-" + pipeElement;
      statsForNerdsWindow.classList.add("statsForNerds");
      statsForNerdsWindow.style.display = "none";
  
      // Close stats for nerds "button"
      const closeButton = document.createElement("div");
      closeButton.id = "statsForNerdsClose-" + pipeElement;
      closeButton.textContent = "[X]";
      closeButton.style.cursor = "pointer";
      closeButton.style.position = "absolute";
      closeButton.style.left = 5;
      closeButton.style.top = 5;
      closeButton.style.padding = 5;
  
      statsForNerdsWindow.appendChild(closeButton);
  
      closeButton.addEventListener("click", () => {
        statsForNerdsWindow.style.display = "none";
        statsForNerdsOpen = false;
      });
  
      // Stats for nerds lines
      const linesWrapper = document.createElement("div");
      linesWrapper.classList.add("statsForNerdsLinesWrapper");
  
      const addStatsForNerdsLine = (title, infoID, defaultValue = "") => {
        const newLine = document.createElement("div");
        newLine.innerHTML = `<div>${title}</div><span id="${infoID}-${pipeElement}">${defaultValue}</span>`;
        linesWrapper.appendChild(newLine);
      };
  
      // Stats in stats for nerds
      addStatsForNerdsLine("Recorder ID", "recorderID", pipeVars["recorderId"]);
      addStatsForNerdsLine("Build", "pipeBuild", (pipeVars["build"] || "-") + " - " + (pipeVars["buildDate"] || ""));
      addStatsForNerdsLine("Rec Client State", "recClientState", state);
      addStatsForNerdsLine("Recording name", "recordingID", "-");
      addStatsForNerdsLine("Recording size", "totalStreamSize", statsForNerdsRecordingSize());
      addStatsForNerdsLine("Received by Server", "totalServerSize", statsForNerdsRecordingSize(0));
      addStatsForNerdsLine("Pipe Buffer size", "totalBufferSize", statsForNerdsRecordingSize());
      addStatsForNerdsLine("Current/Requested Res", "currOptimRes", "-");
      addStatsForNerdsLine("Pipe mimeType", "videoEncoding", recordingOptions.mimeType);
      addStatsForNerdsLine("MR mimeType", "mediarecorderEncoding", "-");
      addStatsForNerdsLine("ws connection latency", "connectionSpeed", "0");
      addStatsForNerdsLine("Region", "pipeRegion", region);
      addStatsForNerdsLine("Audio track settings", "currentAudioSettings", "-");
  
      statsForNerdsWindow.appendChild(linesWrapper);
  
      // append stats for nerds window
      pq.$("#pipeVrec-" + pipeElement).append(statsForNerdsWindow);
  
      const openStatsForNerds = () => {
        statsForNerdsWindow.style.display = "block";
        statsForNerdsOpen = true;
      };
  
      // Right click menu listener
      const customContextMenu = element => {
        const contextMenu = document.createElement("div");
        contextMenu.style.position = "absolute";
        contextMenu.style.display = "none";
        contextMenu.classList.add("pipeContextMenu");
        contextMenu.id = "contextMenu-" + pipeElement;
        // Add the options to the context menu.
        const options = [{ text: "Stats for Nerds", action: openStatsForNerds }];
        for (const option of options) {
          const el = document.createElement("option");
          el.textContent = option.text;
          contextMenu.appendChild(el);
          el.addEventListener("click", () => option.action());
        }
  
        // Append the context menu to the document.
        element.appendChild(contextMenu);
  
        // Show the context menu when the element is right clicked.
        element.addEventListener("contextmenu", event => {
          if (event.ctrlKey || event.metaKey) {
            // Check if the control/command key is pressed
            event.preventDefault();
            // Safari can not open context menu so we open stats for nerds directly
            const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
            if (isSafari) {
              openStatsForNerds();
              return;
            }
            contextMenu.style.display = "flex";
            contextMenu.style.top = event.clientY - element.getBoundingClientRect().top + "px";
            contextMenu.style.left = event.clientX - element.getBoundingClientRect().left + "px";
          }
        });
  
        // Remove the context menu when the user clicks on an element.
        element.addEventListener("click", event => {
          if (event.target !== contextMenu) {
            contextMenu.style.display = "none";
          }
        });
      };
  
      customContextMenu(document.getElementById('pipeVrec-' + pipeElement));
  
      //==================  Video events for playback ===============
  
      videoPlayback.onpause = function () {
        console.log("pipe-log at " + timeStamp() + " pause button pressed,  recorder state = " + state);
  
        if (state == states.PLAYING) {
  
          //jQuery("#pipeVideoInput-"+pipeElement).prop('muted', true);
  
          pipeSetState(states.PAUSED);
  
          pipeSetStatus(PAUSED);
  
          //clearInterval(recordCounter);
          clearInterval(playStreamCounter);
          actualPlaybackTime = playStreamElapsedTime;
  
          pq.$('#pipePlay-' + pipeElement).attr("title", playBtnTxt).html(playIcon);
  
          //event API call
          PipeSDK.recorders[pipeElement].btPausePressed(pipeElement);
  
          // Add pause icon to timer
          addIconToTimer("PAUSE");
        }
      };
  
      videoPlayback.onended = function () {
        pipeStopPlayer();
        // Remove icon from timer
        addIconToTimer("NONE");
  
        // Reset timer
        if (pipeVars["timertype"] == 1) {
          // Count-down timer
          updateTimer(digits(pipeVars["mrt"] - (lastStreamTime || 0)));
        } else {
          // Count-up timer
          updateTimer(digits(lastStreamTime || 0), digits(pipeVars["mrt"]));
        }
      };
  
      const updatePlaybackTimer = (currentTime = videoPlayback.currentTime) => {
        const multiplier = statsForNerdsOpen ? 1000 : 1;
        if (currentTime != "Infinity") {
          updateTimer(digits(currentTime * multiplier), digits(actualStreamTime * multiplier));
        }
      };
  
      videoPlayback.ontimeupdate = function () {
        if (state == states.PLAYING) {
          //console.log(videoPlayback.currentTime);
          updatePlaybackTimer();
        }
      };
  
      videoPlayback.onwaiting = function () {
        if (state == states.PLAYING) {
          pipeShowMessage(bufferingTxt);
        }
      };
  
      videoPlayback.onplaying = function () {
        if (state == states.PLAYING) {
          pipeHideMessage();
        }
      };
  
      videoPlayback.onplay = function () {
        if (state == states.PLAYING) {
          pipeHideMessage();
  
          // Add play icon to timer
          addIconToTimer("PLAY");
        }
      };
  
      // Updates the progress on the playback bar at the bottom of the playback window
      function updatePlaybackProgressBar() {
        // Update progress bar
        const timerProgressBar = document.getElementById('pipeProgressBar-' + pipeElement);
        if (timerProgressBar !== null) {
          const multiplier = statsForNerdsOpen ? 1000 : 1;
          let progressBarWidth = videoPlayback.currentTime * multiplier / (actualStreamTime * multiplier) * 100;
  
          if (progressBarWidth > 100) {
            progressBarWidth = 100;
          }
  
          timerProgressBar.style.width = progressBarWidth + "%";
        }
        state === states.PLAYING && !progressBarIsDragging && requestAnimationFrame(updatePlaybackProgressBar);
      }
  
      // Progress bar seek functionality
      // Function to handle progress bar drag
      function handleProgressBarDrag(event) {
        if (!progressBarIsDragging) return;
        const progressBarWidth = (event.clientX - pipeProgressBar.getBoundingClientRect().left) / pipeProgressBar.offsetWidth * 100;
        pq.$('#pipeProgressBar-' + pipeElement).css("width", `${progressBarWidth}%`);
        playbackSeekPosition = progressBarWidth / 100 * actualStreamTime;
      }
  
      // Function to handle progress bar drag start
      function handleProgressBarDragStart(event) {
        const clickedElement = event.target;
        if (!clickedElement.id === 'pipeProgressBarBorder-' + pipeElement || !clickedElement.id === 'pipeProgressBar-' + pipeElement) {
          return; // Do nothing if the clicked element is not within the progress bar border
        }
        progressBarIsDragging = true;
        handleProgressBarDrag(event);
      }
  
      // Function to handle progress bar drag end
      function handleProgressBarDragEnd() {
        if (!progressBarIsDragging) return;
        progressBarIsDragging = false;
        // Seek the video to the final seek position
        videoPlayback.currentTime = playbackSeekPosition;
        playbackSeekPosition = 0;
        // Set playback timer
        updatePlaybackTimer();
        // Resume progress bar
        requestAnimationFrame(updatePlaybackProgressBar);
      }
  
      // Mobile
      // Function to handle touch start
      function handleProgressBarTouchStart(event) {
        const touch = event.touches[0];
        handleProgressBarDragStart(touch);
      }
  
      // Function to handle touch move
      function handleProgressBarTouchMove(event) {
        // Set progress bar height to be more visible while dragging - 10px
        pq.$('#pipeProgressBar-' + pipeElement).css("height", "10px");
        const touch = event.touches[0];
        handleProgressBarDrag(touch);
      }
  
      // Function to handle touch end
      function handleProgressBarTouchEnd() {
        if (!progressBarIsDragging) return;
        // Reset size of progress bar to default height - 2px
        pq.$('#pipeProgressBar-' + pipeElement).css("height", "2px");
        handleProgressBarDragEnd();
      }
  
      //=========================================================
  
      smallVideoInput = document.getElementById('pipeSmallVideo-' + pipeElement);
      pipeSetStatus(DISABLED);
      pipeShowMessage(connectingTxt);
  
      if (pipeVars["showMenu"] == 0) {
        //add the mic volume meter
        var micDiv = document.createElement("div");
        micDiv.id = 'pipeMicContainer-' + pipeElement;
        micDiv.className = 'pipeMicIconNoMenu';
        document.getElementById('pipeVrec-' + pipeElement).appendChild(micDiv);
  
        // Add the camera input button
        if (pipeVars["ao"] != 1 && !recordingScreen) {
          var camDiv = document.createElement("div");
          camDiv.id = 'pipeCamContainer-' + pipeElement;
          camDiv.className = 'pipeCamContainerNoMenu';
          document.getElementById('pipeVrec-' + pipeElement).appendChild(camDiv);
        }
      }
  
      if (pipeVars["ssb"] != "undefined") {
        if (pipeVars["ssb"] == 0) {
          pq.$(`#pipeMicContainer-${pipeElement} #pipeCamContainer-${pipeElement}`).hide();
        }
      }
  
      //we hide the interface at first and only show it once webcam access has been permitted
      pq.$("#pipeVrec-" + pipeElement).hide();
  
      /**
       * Retrieves the count of audio and video input devices using the MediaDevices API.
       * @returns {Promise<[number, number, MediaDeviceInfo[]]>} A promise that resolves with an array containing the count of audio and video input devices respectively and the total devices.
       */
      const getDevicesCount = async () => {
        let micNr = 0;
        let camNr = 0;
        let devices = [];
  
        try {
          devices = await navigator.mediaDevices.enumerateDevices();
  
          devices.forEach(device => {
            if (device.kind === "audioinput") {
              micNr++;
            } else if (device.kind === "videoinput") {
              camNr++;
            }
          });
        } catch (error) {
          console.error('Error enumerating devices:', error);
        }
  
        return [micNr, camNr, devices];
      };
  
      /**
       * Retrieves the audio and video input devices using the MediaDevices API.
       * @returns {Promise<[MediaDeviceInfo[], MediaDeviceInfo[], MediaDeviceInfo[]]>} A promise that resolves with an array containing the audio and video input devices and the total devices.
       */
      const getInputDevices = async () => {
        let mics = [];
        let cams = [];
        let devices = [];
  
        try {
          devices = await navigator.mediaDevices.enumerateDevices();
  
          devices.forEach(device => {
            if (device.kind === "audioinput") {
              mics.push(device);
            } else if (device.kind === "videoinput") {
              cams.push(device);
            }
          });
        } catch (error) {
          console.error('Error enumerating devices:', error);
        }
  
        return [mics, cams, devices];
      };
  
      /**
       * Combines audio streams
       * @param {MediaStream[]} streams - An array of audio streams to combine.
       * @param {MediaStream} [composedStream=new MediaStream()] - If there already is a stream to compose on.
       * @returns {MediaStream} - The combined audio stream.
       * @function
       */
      const combineAudioStreams = (streams, composedStream = new MediaStream()) => {
        if (streams.length === 0) return composedStream;
  
        const context = new AudioContext();
        const audioDestination = context.createMediaStreamDestination();
  
        // Loop through the streams
        streams.forEach(stream => {
          const source = context.createMediaStreamSource(stream);
          const gain = context.createGain();
          gain.gain.value = 1.0;
          source.connect(gain).connect(audioDestination);
        });
  
        audioDestination.stream && audioDestination.stream.getAudioTracks().forEach(audioTrack => {
          composedStream.addTrack(audioTrack);
        });
  
        return composedStream;
      };
  
      /**
       * Generates the UI for the recording client based on data from the audio-video profile XML data.
       * getUserMedia() is called and the audio-video devices' streams are captured.
       * @param {XMLDocument} data - The response audio-video profile data returned by the server as an XML document.
       * @function
       */
      const generateRecordingClient = async data => {
        var xml_node = pq.$('bandwidth', data);
        //console.log(xml_node.find('bandwidth > item > w').text());
  
        loadedWidth = xml_node.find('bandwidth > item > w').text();
        loadedHeight = xml_node.find('bandwidth > item > h').text();
        loadedFramerate = xml_node.find('bandwidth > item > fps').text();
  
        console.log("pipe-log at " + timeStamp() + " recorder requested resolution: " + loadedWidth + "x" + loadedHeight + " and requested framerate: " + loadedFramerate);
  
        vidWidth = parseInt(loadedWidth) || 640;
        vidHeight = parseInt(loadedHeight) || 360;
        vidFrameRate = parseInt(loadedFramerate) || false;
  
        //get devices
        try {
          [micNumber, camNumber, devices] = await getDevicesCount();
  
          //event API call
          PipeSDK.recorders[pipeElement].userHasCamMic(pipeElement, camNumber, micNumber);
  
          if (recordingScreen == true) {
  
            constraints = {
              video: true,
              audio: true
            };
  
            if (micNumber == 0) {
              //we show the select message in case the screen permissions are in pending
              pipeShowError(selectScreenTxt, 1, 1);
  
              document.getElementById('srecMessage-' + pipeElement).addEventListener('click', async () => {
                if (navigator.mediaDevices.getDisplayMedia) {
                  try {
                    const screenStream = await navigator.mediaDevices.getDisplayMedia(constraints);
                    pipeGetUserMediaSuccess(screenStream);
                  } catch (error) {
                    pipeOnError(error);
                  }
                } else {
                  console.log('Your browser does not support getDisplayMedia API');
                }
              });
            } else {
              //we show the allow message in case the mic permissions are in pending
              pipeShowError(allowMicAccessTxt, 1);
  
              ttaInit = Date.now();
              try {
                const micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
                console.log(`pipe-log at ${timeStamp()} mic access granted for screen recording`);
  
                // Show select message in case screen permissions are pending
                pq.$(`#pipeError-${pipeElement}`).remove();
                pipeShowError(selectScreenTxt, 1, 1);
  
                document.getElementById(`srecMessage-${pipeElement}`).addEventListener('click', async () => {
                  if (navigator.mediaDevices.getDisplayMedia) {
                    try {
                      const screenStream = await navigator.mediaDevices.getDisplayMedia(constraints);
                      const composedStream = new MediaStream();
  
                      // Add video stream from the screen
                      screenStream.getVideoTracks().forEach(videoTrack => composedStream.addTrack(videoTrack));
  
                      // Check if system audio has been shared
                      if (screenStream.getAudioTracks().length > 0) {
                        hasSystemAudio = true;
                        systemAudio = screenStream;
  
                        // Set microphone title to include system audio to let users know that system audio is also captured.
                        pq.$(`#inputMicTitle-${pipeElement}`).text(` ${withSysAudioTxt}`);
  
                        // Combine with microphone stream if available
                        if (micStream && micStream.getAudioTracks().length > 0) {
                          combineAudioStreams([micStream, screenStream], composedStream);
                          console.log(`pipe-log at ${timeStamp()} added mic audio`);
                        } else {
                          combineAudioStreams([screenStream], composedStream);
                        }
  
                        console.log(`pipe-log at ${timeStamp()} added system audio`);
                      } else {
                        // Add just the mic audio
                        micStream.getAudioTracks().forEach(micTrack => composedStream.addTrack(micTrack));
                      }
  
                      pipeGetUserMediaSuccess(composedStream);
  
                      // Set the selected audio device for the input device list
                      inputSelectedDevice.audio = micStream.getAudioTracks()[0].getSettings();
                    } catch (error) {
                      pipeOnError(error);
                    }
                  } else {
                    console.log('Your browser does not support getDisplayMedia API');
                  }
                });
              } catch (error) {
                pipeOnError(error);
              }
            }
          } else {
            // Only if no camera - disable camera button
            if (camNumber === 0) {
              pq.$("#pipeCamIcon-" + pipeElement).switchClass("pipeInputSettingsButton", "pipeInputSettingsButtonDisabled");
            }
  
            //check if we are in audio-only mode or we fallback to audio
            if (camNumber == 0 || pipeVars["ao"] == 1) {
  
              //change the mime type to audio only
              updateRecordingOptions("audio");
  
              constraints = {
                audio: {
                  noiseSuppression: noiseSuppressionVal
                }
              };
  
              //add audio-only thumbnail
              pq.$(audioOnlySVG).insertBefore("#pipeVideoInput-" + pipeElement);
  
              //remove switch button
              pq.$("#pipeSwitchCam-" + pipeElement).hide();
            } else {
              //mobile device constraints
              if (mobile) {
                constraints = {
                  audio: {
                    noiseSuppression: noiseSuppressionVal
                  },
                  video: {
                    width: vidWidth,
                    height: vidHeight,
                    facingMode: mobileCamUsed
                  }
                };
              } else {
                //desktop constraints
                constraints = {
                  audio: {
                    noiseSuppression: noiseSuppressionVal
                  },
                  video: {
                    width: vidWidth,
                    height: vidHeight
                  }
                };
              }
  
              if (vidFrameRate != false) {
                constraints.video.frameRate = vidFrameRate;
              }
            }
  
            // Show access message if permissions are pending or no devices are found
            if (devices.length === 0 || !devices.some(dev => dev.label !== "")) {
              pipeShowError(allowAccessTxt, 1);
            }
  
            console.log(`pipe-log at ${timeStamp()} calling getUserMedia with the following constraints: ${JSON.stringify(constraints)}`);
  
            if (navigator.mediaDevices.getUserMedia) {
              ttaInit = Date.now();
  
              try {
                const recordingStream = await navigator.mediaDevices.getUserMedia(constraints);
                const successCallback = navigator.userAgent.toLowerCase().indexOf("android") != -1 && micGainValue > 1 ? modifyMicrophoneGain(recordingStream) : recordingStream;
  
                pipeGetUserMediaSuccess(successCallback);
              } catch (error) {
                pipeOnError(error);
              }
            } else if (navigator.getUserMedia) {
              ttaInit = Date.now();
              navigator.getUserMedia(constraints, pipeGetUserMediaSuccess, pipeOnError);
            } else {
              console.log('Your browser does not support getUserMedia API');
            }
          }
        } catch (err) {
          console.log(err.name + ": " + err.message);
        }
      };
  
      // Generate the recording client only if the audio-video profile XML data is available, else display blocking error.
      if (qualityProfileData) {
        generateRecordingClient(qualityProfileData);
      } else {
        blockingError = true;
        pipeShowError("Error loading audio-video profile XML data.");
        pq.$("#pipeVrec-" + pipeElement).show();
        console.log("pipe-log at " + timeStamp() + " Error loading audio-video profile XML data.");
      }
  
      /**
       * Formats the label if it contains the default deviceId.
       * @function
       * @param {string} label - The label to format.
       * @param {Boolean} [forceDefault=false] - If the "Default" should be forced upon the label or not.
       * @returns {string} - The formatted label
       */
      const formatDefaultDeviceLabel = (label, forceDefault = false) => {
        let labelToChange = label || "";
        if (!labelToChange.includes(" - ")) {
          if (!forceDefault) return labelToChange;else labelToChange = "Default - " + labelToChange;
        }
        let defaultTxt = "Same as System";
        return `${defaultTxt} - ${labelToChange.split(" - ")[1]}`;
      };
  
      function modifyMicrophoneGain(recordingStream) {
  
        console.log("pipe-log at " + timeStamp() + " increasing the microphone gain with the value: " + micGainValue);
  
        var newRecordingStream = new MediaStream();
        var micStream = new MediaStream();
  
        //add the video stream if any
        if (recordingStream.getVideoTracks().length > 0) {
          recordingStream.getVideoTracks().forEach(function (videoTrack) {
            newRecordingStream.addTrack(videoTrack);
          });
        }
  
        //add the audio stream if any
        if (recordingStream.getAudioTracks().length > 0) {
  
          recordingStream.getAudioTracks().forEach(function (audioTrack) {
            console.log("pipe-log at " + timeStamp() + " original " + audioTrack.kind + " settings:" + JSON.stringify(audioTrack.getSettings()));
            mic = formatDefaultDeviceLabel(audioTrack.label, inputSelectedDevice.audio.deviceId === "default");
            micStream.addTrack(audioTrack);
          });
  
          var context = new AudioContext();
          var audioDestination = context.createMediaStreamDestination();
  
          const micSource = context.createMediaStreamSource(micStream);
          const micGain = context.createGain();
          micGain.gain.value = micGainValue;
          micSource.connect(micGain).connect(audioDestination);
  
          audioDestination.stream.getAudioTracks().forEach(function (modifiedAudioTrack) {
            newRecordingStream.addTrack(modifiedAudioTrack);
          });
        }
  
        return newRecordingStream;
      }
  
      /**
       * Get all audio and video media input devices and populate inputDeviceList.
       * @function
       * @returns A promise resolved with the device list available.
       */
      function getMediaInputs() {
        return new Promise(async (resolve, reject) => {
          try {
            [inputDeviceList.audio, inputDeviceList.video] = await getInputDevices();
            resolve(inputDeviceList);
          } catch (error) {
            console.log("Error fetching devices: " + error);
            reject([[], []]);
          }
        });
      }
  
      // Whether a stream is waiting to be captured
      let waitingForStreamRequest = false;
  
      /**
       * Changes the input using getUserMedia based on the given device
       * @param {String} [type="audio"] - type of device to activate
       * @param {Object} [device=inputSelectedDevice[type]] - selected device to activate
       * @function 
       */
      function setInputStream(type = "audio", device) {
        // Return on following conditions
        if (state === states.RECORDING || waitingForStreamRequest) {
          return;
        }
  
        // Check for type to only be audio or video
        type = type === "audio" || type === "video" ? type : "audio";
  
        // Assign default value to device
        device = device || inputSelectedDevice[type];
  
        // Return if deviceId is null or device is missing
        if (!device || device.deviceId === null) return;
  
        // Workaround for iOS zoom and landscape bug when switching audio and getting same video stream
        if (mobile && type === "audio" && inputSelectedDevice.video.facingMode) {
          // Only if there are available video devices, not audio only and not screen recording
          if (inputDeviceList.video.length > 0 && pipeVars["ao"] != 1 && !recordingScreen) {
            // Only if facingMode is "user" or "environment", else workaround does not work
            if (inputSelectedDevice.video.facingMode === "user" || inputSelectedDevice.video.facingMode === "environment") {
              mobileCamUsed = inputSelectedDevice.video.facingMode === "user" ? "environment" : "user";
              switchCam(device.deviceId, inputSelectedDevice.video.deviceId);
              return;
            }
          }
        }
  
        // Other type -> if type = "audio" -> "video"
        const inverseType = type === "audio" ? "video" : "audio";
  
        // Remove mic icon if video is selected
        if (type === "video" && pipeVars["ao"] != 1) {
          pq.$("#pipeAudioOnly-" + pipeElement).remove();
        }
  
        waitingForStreamRequest = true;
  
        const inverseInputId = inputSelectedDevice[inverseType] ? inputSelectedDevice[inverseType].deviceId : null;
        // If default is selected, get stream direct from device (default will show up in the menu as selected) -> bypass chrome bug
        const bypassDevice = inputDeviceList.audio.find(dev => dev.deviceId !== "default" && dev.deviceId !== "communications" && dev.groupId === device.groupId);
        const idToGet = !bypassDevice ? device.deviceId : device.deviceId === "default" || device.deviceId === "communications" ? bypassDevice.deviceId : device.deviceId;
        const constraints = {
          [type]: { deviceId: idToGet }
        };
  
        // Add noise suppression if needed
        if (type === "audio") {
          constraints[type].noiseSuppression = noiseSuppressionVal;
        }
  
        if (inputDeviceList[inverseType].length > 0 && pipeVars["ao"] != 1 && !(inverseType === "video" && recordingScreen)) {
          constraints[inverseType] = {
            deviceId: inverseInputId
          };
          // Add noise suppression if needed
          if (inverseType === "audio") {
            constraints[inverseType].noiseSuppression = noiseSuppressionVal;
          }
          constraints["video"].width = vidWidth;
          constraints["video"].height = vidHeight;
  
          if (vidFrameRate != false) {
            constraints["video"].frameRate = vidFrameRate;
          }
        }
  
        // Is it a workaround for Android? (not being able to change camera)
        let androidWorkaround = false;
  
        // Log constraints
        console.log("pipe-log at " + timeStamp() + " calling getUserMedia with the following constraints: " + JSON.stringify(constraints));
        ttaInit = Date.now();
        navigator.mediaDevices.getUserMedia(constraints).then(stream => {
          // If screen recording is on, combine screen stream with new audio stream (=> only stop audio tracks, video track is still being used)
          if (recordingScreen && type === "audio") {
            const screenStream = localStream.getVideoTracks()[0];
            const micStream = stream;
  
            // Add the video stream from the screen.
            stream = new MediaStream([screenStream]);
  
            // Check if there is system audio available.
            if (hasSystemAudio && systemAudio) {
              // Combine system audio with microphone audio.
              combineAudioStreams([micStream, systemAudio], stream);
              console.log("pipe-log at " + timeStamp() + " added system audio and mic audio.");
            } else {
              stream = new MediaStream([screenStream, micStream.getAudioTracks()[0]]);
              console.log("pipe-log at " + timeStamp() + " added system mic audio.");
            }
  
            // Stop previous audio tracks from microphone.
            localStream.getAudioTracks().forEach(track => track.stop());
          } else {
            stopMediaTracks(localStream);
          }
          pipeGetUserMediaSuccess(stream, device.deviceId);
          console.log("pipe-log at " + timeStamp() + " Stream activated from " + device.label);
  
          if (recordingScreen) {
            // Change audio device label if srec is active to reflect the audio device name
            inputSelectedDevice.audio.label = hasSystemAudio ? device.label + " " + withSysAudioTxt : device.label;
          }
        }).catch(error => {
          // Workaround for Android devices not being able to switch camera
          if (mobile && type === "video" && error.name === "NotReadableError" && error.message === "Could not start video source") {
            switchCam(inputSelectedDevice.audio.deviceId, device.deviceId);
            androidWorkaround = true; // Set this to true in order to not remove the loading animation before the actual switch
          } else {
            console.log("pipe-log at " + timeStamp() + " Error switching " + type + " device: " + error);
          }
        }).finally(() => {
          waitingForStreamRequest = false;
          // Do not remove loading animation if Android workaround
          if (!androidWorkaround) {
            // Reset loading animation if active
            pq.$("#pipeCircleSpinner-" + device.deviceId).remove();
          }
        });
      }
  
      /**
       * Populates the menu for input device selection
       * @param {String} type - Type of menu (audio or video)
       * @param {Object} [devicesToPopulate=inputDeviceList] - List of input devices to use for populating
       * @param {Boolean} [resetStream=false] - Wether to also reset the input streams or not
       * @function 
       */
      function populateInputSelectList(type, devicesToPopulate = inputDeviceList, resetStream = false) {
        // True if stream also needs a reset - reset all streams calling setInputStream without parameters
        resetStream && setInputStream();
  
        // Check the type
        if (type === "any") {
          // Return if UI is not visible
          if (inputMenuCurrentlyOpen === "") return;
          // Set to correct type
          type = inputMenuCurrentlyOpen;
        }
  
        const audioList = document.getElementById('pipeMicSelect-' + pipeElement);
        const videoList = document.getElementById('pipeVidSelect-' + pipeElement);
  
        // To check if there are any devices availabe for a category
        const hasInputShown = { video: false, audio: false };
  
        /**
         * Loop function to populate the list for input device selection
         * @param {HTMLElement} element - HTML element to populate inside of
         * @param {Array} list - Array with the elements to populate
         * @param {string} type - Type of the list elements (audio or video)
         * @param {Boolean} isActive - Whether the device is active or not 
         * @function 
         */
        function populateLoop(element, list, type, isActive = true) {
          if (!element) return;
          if (list.length > 0) hasInputShown[type] = true;
          if (isActive) element.innerHTML = "";
          // Reset input request
          waitingForStreamRequest = false;
          list.forEach(el => {
            const listElement = document.createElement("li");
            const deviceLabel = el.deviceId === "default" ? formatDefaultDeviceLabel(el.label) : el.label || `Device ${el.deviceId}`;
            listElement.innerText = deviceLabel;
            listElement.innerText += !isActive ? " (disconnected)" : "";
            // Check which device is active by deviceId
            const isSelected = isActive && el.deviceId === inputSelectedDevice[type].deviceId;
            isSelected && listElement.classList.add("selected");
            // Insert disconnected devices at old index
            if (!el.originalIndex && el.originalIndex !== 0 || element.childElementCount === 0 || element.childElementCount === 1 && el.originalIndex !== 0) {
              element.appendChild(listElement);
            } else {
              const indexToInsert = el.originalIndex > element.childElementCount - 1 ? element.childElementCount : el.originalIndex;
              element.insertBefore(listElement, element.children[indexToInsert]);
            }
            !isActive && listElement.classList.add("disconnected");
            // Do not add click listeners if already selected
            if (isSelected) return;
            // Adds loading element when clicked and active
            isActive && listElement.addEventListener("click", () => {
              if (waitingForStreamRequest) return;
              const divLoader = document.createElement('div');
              divLoader.innerHTML = '<span class="pipeCircleSpinner" id="pipeCircleSpinner-' + el.deviceId + '"></span>';
              listElement.insertBefore(divLoader.firstChild, listElement.firstChild);
              console.log("pipe-log at " + timeStamp() + " Requesting stream from " + el.label);
            });
            isActive && listElement.addEventListener("click", () => setInputStream(type, el));
          });
        }
  
        // Populate active devices first, and than inactive
        // Only populate video if NOT audio only
        type === "audio" && populateLoop(audioList, devicesToPopulate.audio, "audio");
        type === "video" && pipeVars["ao"] != 1 && !recordingScreen && populateLoop(videoList, devicesToPopulate.video, "video");
  
        type === "audio" && populateLoop(audioList, inputDisconnectedDevices.audio, "audio", false);
        type === "video" && pipeVars["ao"] != 1 && !recordingScreen && populateLoop(videoList, inputDisconnectedDevices.video, "video", false);
  
        // Checking if there are any audio/video devices displayed and removing the sections if not
        // Audio
        if (!hasInputShown.audio) {
          pq.$("#pipeMediaMenuAudio-" + pipeElement).css("display", "none");
        } else {
          document.getElementById("pipeMediaMenuAudio-" + pipeElement).style.removeProperty("display");
        }
        // Video
        if (!hasInputShown.video) {
          pq.$("#pipeMediaMenuVideo-" + pipeElement).css("display", "none");
        } else {
          document.getElementById("pipeMediaMenuVideo-" + pipeElement).style.removeProperty("display");
        }
      }
  
      // Video effects
      /**
       * Displays a warning about switching on video effects.
       * The message gets removed after 4 seconds.
       * @function
       */
      const displayVideoEffectsWarning = () => {
        pipeShowMessage("Your " + (mobile ? "device" : "computer") + " might slow down while running video effects", 30, "top");
        setTimeout(pipeHideMessage, 4000);
      };
  
      // Background blur
      /**
       * Video that captures the current stream and has absolute values as size.
       * The size has to be set before using it. Capture it by getting clientWidth and clientHeight from the actual recording.
       * To be used for canvases.
       * @type {HTMLVideoElement}
       */
      const absoluteSizeVideo = document.createElement("video");
      absoluteSizeVideo.autoplay = true;
      absoluteSizeVideo.playsInline = true;
      absoluteSizeVideo.muted = true;
      absoluteSizeVideo.controls = false;
  
      /**
       * Canvas to output the blurred processed video on.
       * @type {HTMLCanvasElement}
       */
      const blurMaskCanvas = document.createElement('canvas');
      blurMaskCanvas.id = "pipeVideoInputMaskCanvas-" + pipeElement;
      blurMaskCanvas.style.position = "absolute";
  
      /**
       * Canvas to record the processed video. Needed for keeping the video dimensions.
       * @type {HTMLCanvasElement}
       */
      const recordingCanvas = document.createElement('canvas');
  
      /**
       * Whether the background blur is turned on or not.
       * @type {Boolean}
       */
      let isBlurred = false;
  
      /**
       * Whether the image is flipped horizontally or not. On desktop, it will stay false.
       * @type {Boolean}
       */
      let flipHorizontal = mobile ? window.matchMedia('(orientation: landscape)').matches : false;
  
      /**
       * HTML element that stores the background blur switch (label + checkbox element).
       * @type {HTMLElement}
       * @const
       */
      const blurBackgroundSwitch = document.getElementById("pipeEffectSwitch-" + pipeElement);
  
      /**
       * HTML element that stores the background blur checkbox element.
       * @type {HTMLElement}
       * @const
       */
      const backgroundBlurSwitchCheckbox = document.getElementById("pipeBlurBgCheck-" + pipeElement);
      if (backgroundBlurSwitchCheckbox) backgroundBlurSwitchCheckbox.checked = false;
  
      /**
       * Set of already loaded blur scripts.
       * @type {Set}
       */
      const loadedBlurScripts = new Set();
  
      /**
       * Inserts and loads a script from the given URL and returns a promise.
       * @param {string} url - The URL of the script to load.
       * @returns {Promise<void>} A promise that resolves when the script is loaded successfully, 
       * or rejects with an error if there was a problem loading the script.
       * @function
       */
      const loadScript = url => {
        if (loadedBlurScripts.has(url)) return Promise.resolve();
  
        return new Promise((resolve, reject) => {
          console.log("Loading script: ", url);
          const script = document.createElement('script');
          script.src = url;
          script.onload = () => {
            loadedBlurScripts.add(url);
            resolve();
          };
          script.onerror = () => {
            // Remove the failed script to be able to retry later
            const availableScript = document.querySelector('script[src="' + url + '"]');
            availableScript && availableScript.remove();
            reject(new Error('Error loading script: ' + url));
          };
          document.head.appendChild(script);
        });
      };
  
      /**
       * Loads scripts one after the other in the given order.
       * @param {string[]} urls - An array of URLs to load.
       * @returns {Promise<void>} A promise that resolves when all scripts have been loaded successfully.
       * @throws {Error} If any script fails to load.
       */
      const loadScripts = async urls => {
        await Promise.all(urls.map(async url => await loadScript(url)));
      };
  
      /**
       * Array of URLs for background blur scripts.
       * @type {string[]}
       */
      const backgroundBlurScripts = ["https://cdn.addpipe.com/2.0/video_effects/background_blur/background-blur.js"];
  
      /**
       * Stores an instance of a segmentation model.
       * @type {Segmenter | undefined}
       */
      let segmenter = undefined;
  
      /**
       * Loads and initializes a segmentation model.
       * @function
       * @returns {Promise<Segmenter>} A promise that resolves with the segmentation model, 
       * or rejects with an error if there is a problem loading or initializing the model.
       */
      const loadModel = () => {
        if (segmenter) return Promise.resolve(segmenter);
  
        return new Promise(async (resolve, reject) => {
          if (!bodySegmentation) reject(new Error('Error initializing segmentation model: bodySegmentation not found.'));
          const model = bodySegmentation.SupportedModels.MediaPipeSelfieSegmentation;
          const segmenterConfig = {
            runtime: 'mediapipe',
            solutionPath: 'https://cdn.addpipe.com/2.0/video_effects/background_blur/models'
          };
  
          try {
            segmenter = await bodySegmentation.createSegmenter(model, segmenterConfig);
            resolve(segmenter);
          } catch (error) {
            reject(error);
          }
        });
      };
  
      /**
       * Stores the stream without any effect for fast disabling of effects.
       * @type {MediaStream | undefined}
       */
      let cleanStream = undefined;
  
      /**
       * Resets the localStream variable to a clean stream with no effects.
       * Resets the video element (small and large).
       * @function
       */
      const resetLocalStreamToCleanStream = () => {
        if (!cleanStream) return; // Return if no clean stream (free of effects) is available
        localStream = cleanStream;
        try {
          videoInput.srcObject = localStream;
          smallVideoInput.srcObject = localStream;
        } catch (e) {
          videoInput.src = URL.createObjectURL(localStream);
          smallVideoInput.srcObject = URL.createObjectURL(localStream);
        }
      };
  
      /**
       * Disables the background blurring effect by removing the canvas and setting the UI accordingly.
       * @param {Boolean} [logMessage=true] - Whether or not to log the message informing about the action.
       * @function
       */
      const disableBackgroundBlur = (logMessage = true) => {
        if (backgroundBlurSwitchCheckbox) backgroundBlurSwitchCheckbox.checked = false; // Set blurring checkbox to false
  
        pq.$("#pipeVideoInputMaskCanvasWrapper-" + pipeElement).css("display", "none");
  
        isBlurred = false;
        resetLocalStreamToCleanStream();
  
        logMessage && console.log("pipe-log at " + timeStamp() + " Background blurring deactivated");
      };
  
      /**
       * Combines video and audio streams.
       * @function
       */
      const captureProcessed = () => {
        // Get audio from stream
        const audioTrack = localStream.getAudioTracks()[0];
  
        // Create a new canvas capture stream for the video
        const canvasVideoStream = recordingCanvas.captureStream(vidFrameRate || 30);
  
        // Combine the audio track and the canvas video stream into a new MediaStream
        const combinedStream = new MediaStream();
        combinedStream.addTrack(audioTrack);
        combinedStream.addTrack(canvasVideoStream.getVideoTracks()[0]);
  
        // Store the original stream
        cleanStream = new MediaStream(localStream);
  
        // Reassign localStream to capture the blurring in the recording
        localStream = combinedStream;
  
        // Check if the small video input needs to have the source changed to the new one with the effect on
        if (state === states.PLAYING || state === states.PAUSED) {
          try {
            smallVideoInput.srcObject = localStream;
          } catch (e) {
            smallVideoInput.src = URL.createObjectURL(localStream);
          }
        }
      };
  
      /**
       * Applies real-time background blur to a video stream using body segmentation.
       * @function
       * @param {HTMLVideoElement} video - The HTML video element to be processed.
       * @returns {Promise<void>} A promise that resolves when the blurring operation completes successfully,
       * or rejects with an error if there is a problem loading or initializing the model.
       */
      const blurInRealTime = video => {
        return new Promise((resolve, reject) => {
          if (pipeVars["bgblur"] != 1) return reject("Background blurring option is inactive");
          loadModel().then(model => {
            /**
             * Calculates the dimensions of a video in pixels based on the video size and the size of a containing element.
             * @param {number} videoWidth - The width of the video in pixels.
             * @param {number} videoHeight - The height of the video in pixels.
             * @param {number} elementWidth - The width of the containing element in pixels.
             * @param {number} elementHeight - The height of the containing element in pixels.
             * @returns {Object} An object containing the calculated width and height for displaying the video within the element.
             */
            function calculateVideoDimensions(videoWidth, videoHeight, elementWidth, elementHeight) {
              // Calculate the aspect ratio of the video
              const aspectRatio = videoWidth / videoHeight;
  
              // Calculate the width of the video based on the height of the element
              const calculatedWidth = aspectRatio * elementHeight;
  
              // Check if the calculated width fits within the element
              if (calculatedWidth <= elementWidth) {
                // Video will fit within the element
                return {
                  width: Math.round(calculatedWidth),
                  height: elementHeight
                };
              } else {
                // Video will not fit within the element, so adjust the height instead
                const calculatedHeight = elementWidth / aspectRatio;
                return {
                  width: elementWidth,
                  height: Math.round(calculatedHeight)
                };
              }
            }
  
            // Set the width and height of the absolute size video
            const absoluteDimensions = calculateVideoDimensions(video.videoWidth || vidWidth, video.videoHeight || vidHeight, video.clientWidth, video.clientHeight);
            absoluteSizeVideo.width = absoluteDimensions.width;
            absoluteSizeVideo.height = absoluteDimensions.height;
            // Play absoluteSizeVideo in case it stopped
            absoluteSizeVideo.play();
  
            // Set visual size of canvas
            blurMaskCanvas.style.height = absoluteDimensions.height + "px";
            blurMaskCanvas.style.width = absoluteDimensions.width + "px";
  
            // Insert output canvas after video or enable if already inserted
            if (!document.getElementById("pipeVideoInputMaskCanvasWrapper-" + pipeElement)) {
              // Create a wrapper for the canvas element so it can mimic the video behavior
              const blurCanvasWrapper = document.createElement("div");
              blurCanvasWrapper.id = "pipeVideoInputMaskCanvasWrapper-" + pipeElement;
              blurCanvasWrapper.style.position = "absolute";
              blurCanvasWrapper.style.display = "flex";
              blurCanvasWrapper.style.alignItems = "center";
              blurCanvasWrapper.style.justifyContent = "center";
              blurCanvasWrapper.style.width = "100%";
              blurCanvasWrapper.style.height = video.clientHeight + "px";
              blurCanvasWrapper.style.background = "#000";
              blurCanvasWrapper.style.borderRadius = video.style.borderRadius;
  
              // Initialize canvas
              blurMaskCanvas.height = vidHeight;
              blurMaskCanvas.width = vidWidth;
  
              // Add into DOM
              blurCanvasWrapper.appendChild(blurMaskCanvas);
              video.parentElement.insertBefore(blurCanvasWrapper, video.nextSibling);
  
              // Add window resize event listener so that the canvas gets resized accordingly
              window.onresize = () => {
                if (!isBlurred) return;
                // Set the width and height of the absolute size video
                const dimensions = calculateVideoDimensions(video.videoWidth || vidWidth, video.videoHeight || vidHeight, video.clientWidth, video.clientHeight);
                blurMaskCanvas.style.height = dimensions.height + "px";
                blurMaskCanvas.style.width = dimensions.width + "px";
  
                if (!mobile) return; // No need to check flip if not mobile
                // Check if the orientation has changed
                flipHorizontal = window.matchMedia('(orientation: landscape)').matches;
              };
            } else {
              pq.$("#pipeVideoInputMaskCanvasWrapper-" + pipeElement).css("display", "flex");
            }
  
            const ctx = blurMaskCanvas.getContext('2d');
            ctx.willReadFrequently = true;
  
            // Canvas to draw the video stream on and process
            const processedCanvas = document.createElement('canvas');
            processedCanvas.width = blurMaskCanvas.width;
            processedCanvas.height = blurMaskCanvas.height;
            const processedContext = processedCanvas.getContext('2d');
            processedContext.willReadFrequently = true;
  
            // Set dimensions of recording canvas
            if (mobile) {
              // On mobile
              if (window.matchMedia('(orientation: landscape)').matches) {
                // If Landscape
                recordingCanvas.width = vidWidth;
                recordingCanvas.height = vidHeight;
              } else {
                // If Portrait
                recordingCanvas.width = vidHeight;
                recordingCanvas.height = vidWidth;
              }
            } else {
              recordingCanvas.width = vidWidth;
              recordingCanvas.height = vidHeight;
            }
            const recCtx = recordingCanvas.getContext('2d');
  
            // Capture the video stream from the recording canvas
            captureProcessed();
  
            /**
             * Function to segment each frame of the video stream.
             * @function
             */
            const segmentFrame = () => {
              if (!isBlurred) return; // Return if blurring is not active
  
              // Check for video to be valid
              if (blurMaskCanvas.width <= 0 || blurMaskCanvas.height <= 0) {
                disableBackgroundBlur(false);
                throw new Error("pipe-log at " + timeStamp() + " Invalid video size for applying the background blurring effect.");
              }
  
              processedContext.drawImage(absoluteSizeVideo, 0, 0, absoluteSizeVideo.width, absoluteSizeVideo.height);
              const imageData = processedContext.getImageData(0, 0, blurMaskCanvas.width, blurMaskCanvas.height);
              model.segmentPeople(imageData).then(people => {
                // Blurring effect settings
                const foregroundThreshold = 0.5;
                const backgroundBlurAmount = 5;
                const edgeBlurAmount = 5;
  
                bodySegmentation.drawBokehEffect(blurMaskCanvas, absoluteSizeVideo, people, foregroundThreshold, backgroundBlurAmount, edgeBlurAmount, flipHorizontal).then(() => {
                  // Draw processed image with effect on canvas for user to see
                  ctx.drawImage(blurMaskCanvas, 0, 0);
                  recCtx.drawImage(blurMaskCanvas, 0, 0, recordingCanvas.width, recordingCanvas.height);
                });
              }).catch(error => {
                disableBackgroundBlur(false);
                console.log("pipe-log at " + timeStamp() + " Error calling segmentPeople(): ", error);
              });
              requestAnimationFrame(segmentFrame);
            };
            segmentFrame();
            resolve();
          }).catch(error => {
            reject(error);
          });
        });
      };
  
      // Add an event listener to the background blur checkbox (if available)
      blurBackgroundSwitch && blurBackgroundSwitch.addEventListener("click", async function () {
        // Return if option is disabled
        if (pipeVars["bgblur"] != 1) return;
        // Do not do anything if the checkbox is missing
        if (!backgroundBlurSwitchCheckbox) return;
        // Get the current state of the effect checkbox
        const currentCheckboxState = backgroundBlurSwitchCheckbox.checked;
        // Get the main video element
        const currentVideo = document.getElementById("pipeVideoInput-" + pipeElement);
        // Check state - If not checked -> activate effect; else deactivate.
        if (!currentCheckboxState) {
          // Activating background blur
          // Start loading animation
          this.classList.add("load");
          // Load background blur scripts if not already loaded
          try {
            await loadScripts(backgroundBlurScripts);
            isBlurred = true;
  
            await blurInRealTime(currentVideo);
            console.log("pipe-log at " + timeStamp() + " Background blurring activated");
            backgroundBlurSwitchCheckbox.checked = true;
  
            // Display Effects warning
            displayVideoEffectsWarning();
          } catch (error) {
            // Error during blurring operation
            console.log("pipe-log at " + timeStamp() + " Error during real-time blur operation: ", error);
            isBlurred = false;
            this.classList.remove("load");
          } finally {
            // Remove loading animation
            this.classList.remove("load");
          }
        } else {
          // Deactivating background blur
          disableBackgroundBlur();
        }
      });
  
      /**
       * Resets all the values required for recording according to the newly captured media stream.
       * Does not run if there is an active blocking error.
       * @param {MediaStream} stream - Newly captured media stream.
       * @param {String} audioDeviceId - Optional, only required if the captured audio stream is coming from a "default" or "communications" device. Required for workaround on Chrome.
       * @function
       */
      function pipeGetUserMediaSuccess(stream, audioDeviceId) {
        console.log("pipe-log at " + timeStamp() + " getUserMedia" + (stream ? " success" : ""));
        ttaResult = Date.now();
        //console.log(ttaResult - ttaInit);
        if (blockingError) {
          stream && stopMediaTracks(stream);
          return false;
        }
  
        localStream = stream;
  
        // Set default input devices
        // Get error/info message
        const messageText = document.querySelector('#pipeMsgOverlay-' + pipeElement + ' > *');
        // Check if there are any audio tracks to set
        if (localStream && localStream.getAudioTracks().length > 0) {
          inputSelectedDevice.audio = localStream.getAudioTracks()[0].getSettings();
  
          // Take the passed ID if it is a screen recording with system audio OR if is default of communication.
          const takeGivenId = recordingScreen && hasSystemAudio || audioDeviceId === "default" || audioDeviceId === "communications";
          inputSelectedDevice.audio.deviceId = takeGivenId ? audioDeviceId : inputSelectedDevice.audio.deviceId;
  
          // Remove no mic or camera message if stream is active
          if (messageText && messageText.innerText === noCameraTxt || messageText.innerText === noMicTxt) {
            pipeHideMessage();
          }
        }
  
        // Check if there are any video tracks to set
        if (localStream && localStream.getVideoTracks().length > 0) {
          inputSelectedDevice.video = localStream.getVideoTracks()[0].getSettings();
          inputSelectedDevice.video.label = localStream.getVideoTracks()[0].label; // Also store label of the device
          pq.$("#pipeCamContainer-" + pipeElement).prop("title", camIconTxt + localStream.getVideoTracks()[0].label);
  
          // Check if video has facingMode
          if (inputSelectedDevice.video.facingMode) {
            mobileCamUsed = inputSelectedDevice.video.facingMode;
          }
  
          // Remove no camera message if stream is active
          if (messageText && messageText.innerText === camUsedTxt) {
            pipeHideMessage();
            // Enable mic icon
            pq.$("#pipeMicIcon-" + pipeElement).switchClass("pipeInputSettingsButtonDisabled", "pipeInputSettingsButton");
            pq.$("#pipeMicContainer-" + pipeElement).click(() => {
              toggleInputMenu("audio");
            });
            pipeSetStatus(IDLE);
          }
        }
  
        // Populate media input devices list
        getMediaInputs().then(fetchedDeviceList => {
          populateInputSelectList("any", fetchedDeviceList, false);
        });
  
        // Set stats for nerds current and optimal resolution
        statsForNerdsCurrOptimRes(localStream);
  
        // Set stats for nerds current and optimal resolution
        statsForNerdsCurrOptimRes(localStream);
  
        try {
          videoInput.srcObject = localStream;
          absoluteSizeVideo.srcObject = localStream;
        } catch (e) {
          videoInput.src = URL.createObjectURL(localStream);
          absoluteSizeVideo.src = URL.createObjectURL(localStream);
        }
  
        // Play absoluteSizeVideo in case it stopped
        absoluteSizeVideo.play();
  
        // Set video stream to small video while in playback
        if (state === states.PAUSED || state === states.PLAYING) {
          try {
            smallVideoInput.srcObject = localStream;
          } catch (e) {
            smallVideoInput.src = URL.createObjectURL(localStream);
          }
        }
  
        pq.$("#pipeError-" + pipeElement).remove();
        pq.$("#pipeVrec-" + pipeElement).show();
  
        //show the audio meter and camera even if the menu is hidden
        if (pipeVars["showMenu"] == 0) {
          pq.$('#pipeMicContainer-' + pipeElement).html('<div class="pipeInputSettingsButton" style="vertical-align:initial;display:inline-block;fill:' + menuCol + '; color:' + menuCol + '" id="pipeMicIcon-' + pipeElement + '">' + microphoneIcon + '</div><div class="pipeMeter-container"><div class="pipeMeter" style="background: ' + menuCol + '" id="audioMeter-' + pipeElement + '"></div></div>');
  
          pq.$("#pipeMicContainer").prop("title", micIconTxt);
  
          // Assign the click event properly
          pq.$("#pipeMicContainer-" + pipeElement).unbind('click').click(() => {
            toggleInputMenu("audio");
          });
  
          if (pipeVars["ao"] != 1 && !recordingScreen) {
            pq.$('#pipeCamContainer-' + pipeElement).html('<div class="pipeInputSettingsButton" style="vertical-align:initial;display:inline-block; color:' + menuCol + '" id="pipeCamIcon-' + pipeElement + '">' + cameraIcon(menuCol) + '</div>')
            // Assign the click event properly
            .unbind('click').click(() => {
              toggleInputMenu("video");
            });
          }
  
          // Reset CSS values of device selector buttons when no menu is available
          // Mic
          pq.$("#pipeMicContainer-" + pipeElement).css("bottom", "0px").css("right", "0px").css("height", extraGap + 'px');
          // Camera
          pq.$("#pipeCamContainer-" + pipeElement).css("bottom", "0px").css("right", "65px").css("height", extraGap + 'px');
          // Device menu
          pq.$("#pipeMediaSelectMenu-" + pipeElement).css("translate", '0px -' + extraGap + 'px');
        }
  
        document.getElementById('pipeMediaSelectMenu-' + pipeElement).style.removeProperty("display");
  
        if (micPerm != "" || camPerm != "") {
          // Sending "accountHash" and "environmentId" (eid) with "pipeGUMSuccess" is deprecated.
          socket.emit('pipeGUMSuccess', { 'accHash': pipeVars["accountHash"], 'eid': pipeVars["eid"] ? pipeVars["eid"] : '1', 'tta': ttaResult - ttaInit, 'camPerm': camPerm, 'micPerm': micPerm });
        } else {
          // Sending "accountHash" and "environmentId" (eid) with "pipeGUMSuccess" is deprecated.
          socket.emit('pipeGUMSuccess', { 'accHash': pipeVars["accountHash"], 'eid': pipeVars["eid"] ? pipeVars["eid"] : '1', 'tta': ttaResult - ttaInit });
        }
  
        // Only set state to idle if the stream is not changed during playback OR if stream is not offline after a recording ("recorded")
        if (localStream && state !== states.PAUSED && state !== states.PLAYING && state !== states.RECORDED) {
          pipeSetState(states.IDLE);
        }
  
        //event API call
        PipeSDK.recorders[pipeElement].onCamAccess(pipeElement, true);
        PipeSDK.recorders[pipeElement].onFlashReady(pipeElement);
  
        //dispatch custom event for get media success
        pq.$("#" + pipeElement).trigger("pipeGotStream");
  
        //default we consider no mic input
        pq.$("#pipeMicIcon-" + pipeElement).html(microphoneDisabledIcon);
        pq.$("#pipeMicContainer-" + pipeElement).prop("title", "No audio input");
  
        localStream && localStream.getTracks().forEach(function (track) {
          //console.log(track);
          console.log("pipe-log at " + timeStamp() + " " + track.kind + " settings:" + JSON.stringify(track.getSettings()));
          if (track.kind == "audio") {
  
            if (track.readyState == "live") {
              pq.$("#pipeMicIcon-" + pipeElement).html(microphoneIcon);
              pq.$("#pipeMicContainer-" + pipeElement).prop("title", micIconTxt + (audioDeviceId === "default" ? "Same as System - " : "") + formatDefaultDeviceLabel(track.label));
            } else {
              pq.$("#pipeMicIcon-" + pipeElement).html(microphoneDisabledIcon);
              pq.$("#pipeMicContainer-" + pipeElement).prop("title", "No audio input");
            }
  
            track.onended = function (event) {
              // console.log("track.onended");
              const t = track;
              // Prevents event to be called on old stream on Safari
              if (t.getSettings().deviceId !== inputSelectedDevice.audio.deviceId) return;
              pq.$("#pipeMicIcon-" + pipeElement).html(microphoneDisabledIcon);
              pq.$("#pipeMicContainer-" + pipeElement).prop("title", "No audio input");
            };
  
            try {
              window.AudioContext = window.AudioContext || window.webkitAudioContext;
              window.audioContext = new AudioContext();
            } catch (e) {
              console.log('Web Audio API not supported.');
            }
  
            //cleanup in case of camera switching on mobile devices
            if (soundMeter) {
              soundMeter.stop();
              soundMeter = null;
            }
  
            soundMeter = new SoundMeter(window.audioContext);
            soundMeter.connectToSource(localStream, function (e) {
              if (e) {
                console.log(e);
                return;
              } else {
                micInterval = setInterval(function () {
  
                  //event API call
                  if (document.getElementById(pipeElement) != null) {
                    PipeSDK.recorders[pipeElement].onMicActivityLevel(pipeElement, Math.round(soundMeter.instant.toFixed(2) * 100));
                  }
  
                  if (document.getElementById("audioMeter-" + pipeElement) != null) {
                    document.getElementById("audioMeter-" + pipeElement).style.height = 24 - Math.round(soundMeter.instant.toFixed(2) * 100) + "px";
                  }
  
                  nrOfMicLevelCalls++;
                  sumMicLevel += Math.round(soundMeter.instant.toFixed(2) * 100);
                }, 100);
  
                intervals.push(micInterval);
              }
            });
          }
        });
        // If blurring is turned on, capture the canvas as video
        isBlurred && captureProcessed();
      }
  
      //=================== Media Recorder events ==========================
      function handleMediaRecorderStart() {
        console.log("pipe-log at " + timeStamp() + " recorder onstart & state = " + pipeMediaRecorder.state + " with timeslice value " + timeSlice);
  
        if (pipeMediaRecorder.state == "inactive") {
          return;
        }
  
        actualStreamTime = 0;
  
        nextSliceIndex = 0;
  
        try {
  
          newFileName = generateName();
  
          // Update recording id in stats for nerds
          pq.$("#recordingID-" + pipeElement).text(newFileName);
  
          //get active stream and check readyState. Also getting currently active cam and mic names
          localStream.getTracks().forEach(function (track) {
            //console.log(track);
            if (track.kind == "audio") {
              mic = formatDefaultDeviceLabel(track.label, inputSelectedDevice.audio.deviceId === "default");
              micReadyState = track.readyState;
              micMuted = track.muted;
              console.log("pipe-log at " + timeStamp() + " audio track.readyState=" + track.readyState + ", track.muted=" + track.muted);
            }
            if (track.kind == "video") {
              cam = isBlurred ? inputSelectedDevice.video.label || track.label : track.label; // Get device name from selected device if blurring is active
              camReadyState = track.readyState;
              camMuted = track.muted;
              console.log("pipe-log at " + timeStamp() + " video track.readyState=" + track.readyState + ", track.muted=" + track.muted);
            }
          });
  
          //check and make sure all devices are "live"
          if (recordingScreen == false) {
            if (pipeVars["ao"] != 1) {
              if (camNumber > 0 && camReadyState != "live" || micReadyState != "live") {
                if (camReadyState != "live") {
                  return pipeShowMessage(noCameraTxt);
                } else if (micReadyState != "live") {
                  return pipeShowMessage(noMicTxt);
                }
              }
            } else {
              if (micReadyState != "live") {
                return pipeShowMessage(noMicTxt);
              }
            }
          } else {
            if (micNumber > 0 && micReadyState != "live") {
              return pipeShowMessage(noMicTxt);
            } else if (camReadyState != "live") {
              //this is actually the video track from the screen. Checking it to see if it is live, if not return error.
              return pipeShowError(screenPermissionTxt);
            }
          }
  
          pipeHideMessage();
  
          incomingDataHasSize = false;
          setTimeout(function () {
            if (incomingDataHasSize == false) {
              pipeShowMessage("Waiting for data..", 50);
            }
          }, 300);
  
          pq.$('#pipeRec-' + pipeElement).attr("title", stopBtnTxt).html(stopRecIcon);
  
          lastStreamTime = 0;
          timeSinceRecBtnPressed = 0;
          recordCounter = setInterval(pipeCounter, 1000); // Reset recording timer interval.
          intervals.push(recordCounter);
  
          streamStartTime = Date.now(); // Reset value of when the recording started.
          streamTimeNoData = 0; // Reset to 0 for new stream.
          streamCounter = setInterval(pipeStreamCounter, 100);
          intervals.push(streamCounter);
  
          autoSaveVid = 0;
          if (pipeVars["asv"] == 1 || pipeVars["asv"] == undefined) {
            autoSaveVid = 1;
          }
  
          audioOnly = 0;
          if (pipeVars["ao"] == 1) {
            audioOnly = 1;
          }
  
          // Set timer icon
          addIconToTimer("REC");
  
          // Send video effects information
          const videoEffects = [];
          isBlurred && videoEffects.push("bgBlur");
  
          // Sending "accountHash" and "environmentId" with "streamStart" is deprecated.
          var startData = {
            'streamName': newFileName,
            'started': true,
            'micMuted': micMuted,
            'micReadyState': micReadyState,
            'camMuted': camMuted,
            'camReadyState': camReadyState,
            'autoSave': autoSaveVid,
            'accountHash': pipeVars["accountHash"],
            'payload': pipeVars["payload"] ? pipeVars["payload"] : '',
            'httpReferer': window.location.href,
            'environmentId': pipeVars["eid"] ? pipeVars["eid"] : '1',
            'cameraName': cam,
            'microphoneName': mic,
            'audioOnly': audioOnly,
            'videoEffects': videoEffects
          };
  
          socket.emit('streamStart', startData);
          console.log("pipe-log at " + timeStamp() + " streamStart " + newFileName);
          recordingStopped = false;
  
          emitFromBuffer();
  
          retryRecordingWithFallback = false; // Reset the value.
        } catch (e) {
          pipeOnError(e);
        }
      }
  
      function handleMediaRecorderStop() {
        console.log("pipe-log at " + timeStamp() + " recorder stopped  & state = " + pipeMediaRecorder.state);
  
        // Remove the icon from the timer
        addIconToTimer("NONE");
  
        // Log socket buffer amount
        if (!recorderDisconnected && socket.io.engine.transport.ws) {
          console.log("pipe-log at " + timeStamp() + " Socket bufferedAmount: " + socket.io.engine.transport.ws.bufferedAmount);
        }
        // Log buffer length
        console.log("pipe-log at " + timeStamp() + " Buffer length: " + buffer.length);
  
        rightAfterReconnect = false;
        recordingStopped = true;
  
        if (pipeRecorderRemoved == false && recorderDisconnected == false && incomingDataHasSize == true) {
          pipeShowMessage(uploadingTxt);
        }
        //console.log(buffer);
        if (buffer.length == 0) {
          if (recorderDisconnected == false) {
            socket.emit('streamStop', { 'bufferLength': buffer.length, "origin": "handleMediaRecorderStop" });
            console.log("pipe-log at " + timeStamp() + " streamStop " + newFileName);
          }
        }
  
        // Create download link in stats for nerds
        statsForNerdsCreateDownloadVideo();
      }
  
      function handleMediaRecorderDataAvailable(e) {
  
        if (e.data.size > 0) {
          if (incomingDataHasSize == false) {
            incomingDataHasSize = true;
            pipeHideMessage();
  
            //event API call
            PipeSDK.recorders[pipeElement].onRecordingStarted(pipeElement);
          }
        }
        recordedChunks.push(e.data);
  
        buffer.push(e);
        totalStreamSize += e.data.size;
        //console.log("Total Stream size " + totalStreamSize);
  
        // Update video size for stats for nerds
        pq.$('#totalStreamSize-' + pipeElement).html(statsForNerdsRecordingSize());
  
        // Update size in timer at the top if switched to size view
        timerSwitchToSize && updateTimer(bytesToReadableValue(totalStreamSize), bytesToReadableValue(pipeVars["recordingSizeLimit"]));
  
        if (recorderDisconnected && !blockingError) {
          // Add Pipe buffer to stats for nerds
          const bufferSize = buffer.reduce((acc, curr) => acc + curr.data.size, 0);
          pq.$("#totalBufferSize-" + pipeElement).text(statsForNerdsRecordingSize(bufferSize) + " (" + buffer.length + " slices)");
        }
  
        // Call the counter whenever data is available if stats for nerds is open
        statsForNerdsOpen && pipeCounter();
      }
  
      function handleMediaRecorderWarning(e) {
        console.log('Warning: ' + e);
      }
  
      function handleMediaRecorderError(event) {
        const e = event.error;
        pipeOnError(e);
      }
  
      socket.on('finishedUploading', function (msg) {
        // If recording is stopped because inputs are missing -> check for state to be "recorded", else stop
        state !== states.RECORDED && pipeStop();
  
        console.log("pipe-log at " + timeStamp() + " " + JSON.stringify(msg) + " " + newFileName);
  
        totalStreamSize = 0;
  
        if (incomingDataHasSize == false) {
          btSaveCanBeUsed = false;
        }
  
        // ===== auto save the recording if set to 1 or default to autosaving if not set at all =====
        if (pipeVars["asv"] == 1 || pipeVars["asv"] == undefined) {
          pipeSaveVideo();
        } else {
          pipeHideMessage();
        }
  
        pipeSetStatus(STOPPED);
  
        //event API call
        if (incomingDataHasSize == true) {
          // The audio codec is taken from MediaRecorder mimeType if available. 
          // If not, "aac" is hardcoded for Safari and "opus" for the rest of the browsers (Firefox)
          let audioCodec = isSafariOnMac ? "aac" : "opus";
          if (pipeMediaRecorder.mimeType.split('=')[1]) {
            audioCodec = pipeMediaRecorder.mimeType.split('=')[1].split(',')[1];
          }
  
          // The video codec will be taken from the mimeType if available (always available on Chrome[116], event with fallback)
          // If not, "h264" is hardcoded for Safari and "vp8" for the rest of the browsers (Firefox)
          const videoCodecMatch = recordingOptions.mimeType.match(/=(\w+)/);
          const videoCodec = videoCodecMatch ? videoCodecMatch[1] : isSafariOnMac ? "h264" : "vp8";
  
          if (pipeVars["ao"] == 1) {
            PipeSDK.recorders[pipeElement].onUploadDone(pipeElement, newFileName, streamElapsedTime, audioCodec, videoCodec, streamExtension, true, storageS3Location);
          } else {
            PipeSDK.recorders[pipeElement].onUploadDone(pipeElement, newFileName, streamElapsedTime, audioCodec, videoCodec, streamExtension, false, storageS3Location);
          }
        }
      });
  
      if (pipeVars["showMenu"] == 0) {
        pq.$("#pipeMenu-" + pipeElement).hide();
      }
  
      function emitFromBuffer() {
        if (!recorderDisconnected) {
  
          // Add Pipe buffer to stats for nerds
          const bufferSize = buffer.reduce((acc, curr) => acc + curr.data.size, 0);
          pq.$("#totalBufferSize-" + pipeElement).text(statsForNerdsRecordingSize(bufferSize) + " (" + buffer.length + " slices)");
  
          if (buffer.length > 0) {
            //console.log(buffer);
  
            var packet;
  
            if (timeSlice == 200) {
              //we always get the first element, because after emit acknowledgment it changes
              var chunk = buffer[0];
              packet = {
                data: chunk.data,
                size: chunk.data.size,
                index: nextSliceIndex,
                totalRecordedSize: totalStreamSize
              };
            } else {
  
              //if the timeslice is set at 10ms, we join smaller blobs into a single bigger blob in intervals of maximum 20 small blobs.
              //The result is very similar as if we were recording with 200ms timeslices, thus having a lot fewer requests being sent to the server.
              if (!bufferWasUpdated) {
                buffer.splice(0, intermediateBuffer.length);
                bufferWasUpdated = true;
                //console.log("BUFFER WAS NOT UPDATED");
              }
              intermediateBuffer = [];
              if (buffer.length >= 20) {
                intermediateBuffer = buffer.slice(0, 20);
              } else {
                intermediateBuffer = buffer.slice(0, buffer.length);
              }
              //console.log(intermediateBuffer);
              arrayOfBlobs = intermediateBuffer.map(chunk => chunk.data);
  
              var singleBlob = new Blob(arrayOfBlobs, { type: "video/mp4" });
              //console.log(singleBlob);
              packet = {
                data: singleBlob,
                size: singleBlob.size,
                index: nextSliceIndex,
                totalRecordedSize: totalStreamSize
              };
  
              bufferWasUpdated = false;
            }
  
            socket.emit('stream', packet, totalReceivedSize => {
              // console.log("Received size "+totalReceivedSize);
  
              pq.$("#totalServerSize-" + pipeElement).text(statsForNerdsRecordingSize(totalReceivedSize || 0));
  
              if (timeSlice == 200) {
                buffer.shift();
              } else {
                buffer.splice(0, intermediateBuffer.length);
                bufferWasUpdated = true;
              }
  
              nextSliceIndex++;
  
              // Add Pipe buffer to stats for nerds
              const bufferSize = buffer.reduce((acc, curr) => acc + curr.data.size, 0);
              pq.$("#totalBufferSize-" + pipeElement).text(statsForNerdsRecordingSize(bufferSize) + " (" + buffer.length + " slices)");
  
              if (pipeMediaRecorder.state == "inactive" && incomingDataHasSize) {
                percentageUploaded = Math.round(totalReceivedSize / totalStreamSize * 100);
                pipeShowMessage(uploadingTxt + percentageUploaded + "%");
  
                //event API call
                PipeSDK.recorders[pipeElement].onUploadProgress(pipeElement, percentageUploaded);
              }
              emitFromBuffer();
            });
          } else {
            if (!recordingStopped) {
              setTimeout(emitFromBuffer, 250);
            } else {
              socket.emit('streamStop', { 'bufferLength': buffer.length, "origin": "emitFromBuffer" });
              console.log("pipe-log at " + timeStamp() + " streamStop " + newFileName);
  
              // Add Pipe buffer to stats for nerds
              const bufferSize = buffer.reduce((acc, curr) => acc + curr.data.size, 0);
              pq.$("#totalBufferSize-" + pipeElement).text(statsForNerdsRecordingSize(bufferSize) + " (" + buffer.length + " slices)");
            }
          }
        }
      }
  
      //======================== Socket connection events ===========================
  
      socket.on('connect', function () {
        console.log("pipe-log at " + timeStamp() + " connection established ");
        recorderDisconnected = false;
        //event API call
        PipeSDK.recorders[pipeElement].onConnectionStatus(pipeElement, "connected");
  
        initialConnectionWorked = true;
        connectionCounter++;
  
        if (connectionCounter == 1) {
          //enable the record button and hide the notification
          pipeSetStatus(IDLE);
          const innerMessage = document.querySelector('#pipeMsgOverlay-' + pipeElement + ' > *');
          if (innerMessage && innerMessage.innerText === connectingTxt) {
            pipeHideMessage();
          }
  
          //dispatch custom event for first connection success
          pq.$("#" + pipeElement).trigger("pipeGotConnection");
        }
  
        if (isFallbackConnection == true && connectionCounter == 1 && state == states.IDLE) {
          //if this is the first successful connection after a fallback we make sure to insert the recorder logs if we are in an idle state as a result of GUM success
          if (micPerm != "" || camPerm != "") {
            // Sending "accountHash" and "environmentId" (eid) with "pipeGUMSuccess" is deprecated.
            socket.emit('pipeGUMSuccess', { 'accHash': pipeVars["accountHash"], 'eid': pipeVars["eid"] ? pipeVars["eid"] : '1', 'tta': ttaResult - ttaInit, 'camPerm': camPerm, 'micPerm': micPerm });
          } else {
            // Sending "accountHash" and "environmentId" (eid) with "pipeGUMSuccess" is deprecated.
            socket.emit('pipeGUMSuccess', { 'accHash': pipeVars["accountHash"], 'eid': pipeVars["eid"] ? pipeVars["eid"] : '1', 'tta': ttaResult - ttaInit });
          }
        }
      });
  
      socket.on('connect_error', function (error) {
        const errorMessage = typeof error === "string" ? error : error.message;
        console.log("pipe-log at " + timeStamp() + " socket connect_error " + errorMessage);
  
        // Allow passthrough for "websocket error". Error occurs on disconnection and is handled by socket.io.on('error')
        if (error.message === "websocket error") return;
  
        //event API call
        PipeSDK.recorders[pipeElement].onConnectionStatus(pipeElement, "connect_error:" + errorMessage);
  
        // Block recording client and show error
        blockingError = true;
        pipeShowError(errorMessage);
      });
  
      socket.on('connect_timeout', function (timeout) {
        console.log("pipe-log at " + timeStamp() + " connect_timeout " + timeout);
        //event API call
        PipeSDK.recorders[pipeElement].onConnectionStatus(pipeElement, "connection_timeout");
  
        pipeShowMessage("Connection timeout. Reconnecting in a few seconds...", 30, "top");
      });
  
      socket.io.on('error', function (error) {
        console.log("pipe-log at " + timeStamp() + " error " + error);
        //event API call
        PipeSDK.recorders[pipeElement].onConnectionStatus(pipeElement, "error:" + error);
  
        //if first connection attempt failed, we attempt a fallback
        if (initialConnectionWorked == false && html5FallbackServer != "") {
          // Get "fallback" log message first time, else get "retrying" log message (also display region us1 or us2).
          // Note: If "region" is undefined, display "US".
          const logMessage = storageS3Location === storageS3FallbackLocation ? "retrying " + (region || "US") + " region" : "falling back to " + (region ? region === "us1" ? "us2" : "us1" : "US") + " region";
  
          console.log("pipe-log at " + timeStamp() + " server did not respond, " + logMessage);
  
          // Set "region" accordingly
          if (region && storageS3Location !== storageS3FallbackLocation) {
            region = region === "us1" ? "us2" : "us1";
          }
  
          socket.close();
  
          html5Server = html5FallbackServer;
          storageS3Location = storageS3FallbackLocation;
          wsURL = "https://" + html5Server;
          wssOptions.query += "&fallback=true";
          _callbacks = socket._callbacks;
  
          socket = null;
          socket = io(wsURL, wssOptions);
          socket._callbacks = _callbacks;
  
          isFallbackConnection = true;
        }
      });
  
      socket.on('disconnect', function (reason) {
        console.log("pipe-log at " + timeStamp() + " disconnect reason " + reason);
        //console.log("TRANSPORT: " + socket.io.engine.transport.name);
        pipeShowMessage("Not Connected. Reconnecting in a few seconds...", 30, "top");
  
        recorderDisconnected = true;
  
        //event API call
        PipeSDK.recorders[pipeElement].onConnectionStatus(pipeElement, "disconnected: " + reason);
      });
  
      // Saving the recording failed
      socket.on('saveRecordingError', error => {
        switch (error.message) {
          case "missing_hash_file":
            console.log("pipe-log at " + timeStamp() + " Recording cannot be saved due to missing hash file.");
            pipeShowMessage(unableToSaveTxt);
            // Disable the save and play buttons
            pipeSetStatus(IDLE);
            break;
          case "missing_recording_file":
            console.log("pipe-log at " + timeStamp() + " Recording cannot be saved due to missing video file.");
            pipeShowMessage(unableToSaveTxt);
            // Disable the save and play buttons
            pipeSetStatus(IDLE);
            break;
          default:
            console.log("pipe-log at " + timeStamp() + " Recording cannot be saved.");
            break;
        }
      });
  
      socket.io.on('reconnect', function (attemptNumber) {
        console.log("pipe-log at " + timeStamp() + " reconnect at attemptNumber: " + attemptNumber);
  
        if (state == states.RECORDING || state == states.RECORDED) {
          autoSaveVid = 0;
          if (pipeVars["asv"] == 1 || pipeVars["asv"] == undefined) {
            autoSaveVid = 1;
          }
          audioOnly = 0;
          if (pipeVars["ao"] == 1) {
            audioOnly = 1;
          }
  
          // Sending "accountHash" and "environmentId" with "streamResume" is deprecated.
          var resumeData = {
            'streamName': newFileName,
            'started': true,
            'micMuted': micMuted,
            'micReadyState': micReadyState,
            'camMuted': camMuted,
            'camReadyState': camReadyState,
            'autoSave': autoSaveVid,
            'accountHash': pipeVars["accountHash"],
            'payload': pipeVars["payload"] ? pipeVars["payload"] : '',
            'httpReferer': window.location.href,
            'environmentId': pipeVars["eid"] ? pipeVars["eid"] : '1',
            'cameraName': cam,
            'microphoneName': mic,
            'audioOnly': audioOnly,
            'index': nextSliceIndex
          };
  
          recorderDisconnected = false;
          rightAfterReconnect = true;
  
          if (buffer.length > 0) {
            socket.emit('streamResume', resumeData);
            console.log("pipe-log at " + timeStamp() + " state =  " + state + ", streamResume " + newFileName);
  
            emitFromBuffer();
          }
        } else {
          recorderDisconnected = false;
          rightAfterReconnect = true;
        }
  
        pipeShowMessage("Reconnected", 15, "top");
        setTimeout(pipeHideMessage, 2000);
  
        //event API call
        PipeSDK.recorders[pipeElement].onConnectionStatus(pipeElement, "reconnected");
      });
  
      socket.io.on('reconnect_attempt', function (attemptNumber) {
        console.log("pipe-log at " + timeStamp() + " reconnecting attemptNumber: " + attemptNumber);
  
        pipeShowMessage("Not Connected. Reconnecting...", 28, "top");
        //event API call
        PipeSDK.recorders[pipeElement].onConnectionStatus(pipeElement, "reconnecting");
      });
  
      socket.io.on('reconnect_error', function (error) {
        console.log("pipe-log at " + timeStamp() + " reconnect_error " + error);
  
        if (String(error).indexOf("xhr") != -1) {
          pipeShowMessage("Not Connected (xhr). Reconnecting in a few seconds...", 32, "top");
        } else if (String(error).indexOf("websocket") != -1) {
          pipeShowMessage("Not Connected (wss). Reconnecting in a few seconds...", 32, "top");
        }
        //event API call
        PipeSDK.recorders[pipeElement].onConnectionStatus(pipeElement, "reconnect_error");
      });
  
      socket.io.on('reconnect_failed', function () {
        console.log("pipe-log at " + timeStamp() + " reconnect_failed");
  
        pipeShowError(conInterruptedTxt);
        //event API call
        PipeSDK.recorders[pipeElement].onConnectionStatus(pipeElement, "reconnect_failed");
        PipeSDK.recorders[pipeElement].onConnectionClosed(pipeElement);
      });
  
      socket.on('ping', function () {
        //console.log("pipe-log at " + timeStamp() + " ping");
      });
  
      // Deprecated since socket.io 3.0
      socket.on('pong', function (latency) {
        // console.log("pipe-log at " + timeStamp() + " pong: " + latency + " ms");
        // Update connection speed in stats for nerds
        // if (statsForNerdsOpen && !blockingError)  {
        //   document.getElementById("connectionSpeed-"+pipeElement).innerText = latency + " ms";
        // }
      });
  
      setInterval(() => {
        const start = Date.now();
        // volatile, so the packet will be discarded if the socket is not connected
        socket.volatile.emit("customPing", () => {
          const latency = Date.now() - start;
          // Update connection speed in stats for nerds
          if (statsForNerdsOpen && !blockingError) {
            document.getElementById("connectionSpeed-" + pipeElement).innerText = latency + " ms";
          }
        });
      }, 5000);
  
      //custom events for whitelisted hosts check
      socket.on('invalidHost', function (msg) {
        blockingError = true;
        pipeShowError(invalidHostError);
      });
  
      socket.on('invalidAccountHash', function (msg) {
        blockingError = true;
        pipeShowError(msg.error);
      });
  
      socket.on('invalidEnvironment', function (msg) {
        blockingError = true;
        pipeShowError(msg.error);
      });
  
      socket.on('invalidStreamName', function (msg) {
        blockingError = true;
        pipeShowError(msg.error);
      });
  
      socket.on('accountValidationError', function (msg) {
        blockingError = true;
        pipeShowError(msg.error);
      });
  
      socket.on('recordingSizeLimitReached', function (msg) {
        console.log("pipe-log at " + timeStamp() + " Recording Size limit reached. Stopping recording!");
        pipeStop();
      });
  
      /**
       * Allows the change of state of the pipe recorder. Only valid states are accepted.
       * @param {String} newState - New state of the pipe recorder. Valid states can be selected from the "states" object.
       * @function
       */
      const pipeSetState = newState => {
        if (!newState) return; // Do not allow empty states.
  
        newState = newState.toString().toUpperCase(); // Make sure it is upper case.
        if (!states[newState]) return; // Do not allow non-valid states.
        state = states[newState]; // Set new valid state.
  
        // Update Stats For Nerds
        pq.$("#recClientState-" + pipeElement).html(state);
      };
  
      /**
       * Manages the state of the UI buttons inside the recording client.
       */
      function pipeSetStatus(nextState) {
        const DEFAULT_DISABLED_BTN_CLASS = "pipeBtnOff";
        const DEFAULT_ENABLED_BTN_CLASS = "pipeBtn";
  
        /**
         * Remove all click and keydown events from the button. Also add a disabled class to the button if needed.
         * @param {string} buttonId - The id of the button. It will be completed with the id of the pipeElement.
         * @param {boolean} [addClass=false] - Whether to add a disabled class or not.
         * @param {string} [classToAdd="pipeBtnOff"] - The disabled class to add. By default, it is "pipeBtnOff".
         */
        const removeButtonEvents = (buttonId, addClass = false, classToAdd = DEFAULT_DISABLED_BTN_CLASS) => {
          pq.$(`${buttonId}-${pipeElement}`).off("click").off("keydown");
          if (!addClass) return;
          pq.$(`${buttonId}-${pipeElement}`).attr("class", classToAdd);
        };
  
        /**
         * Add click and keydown events from the button. Also add enabled class if needed.
         * @param {string} buttonId - The id of the button. It will be completed with the id of the pipeElement.
         * @param {*} callback - The callback function to be called on click/keydown.
         * @param {boolean} [onKeyDown=false] - Whether to add keydown event or not.
         * @param {boolean} [addClass=false] - Whether to add an enabled class or not.
         * @param {string} [classToAdd="pipeBtnOff"] - The enabled class to add. By default, it is "pipeBtn".
         */
        const addButtonEvents = (buttonId, callback, onKeyDown = false, addClass = false, classToAdd = DEFAULT_ENABLED_BTN_CLASS) => {
          pq.$(`${buttonId}-${pipeElement}`).click(callback);
  
          onKeyDown && pq.$(`${buttonId}-${pipeElement}`).keydown(event => {
            if (event.which == 13) {
              event.preventDefault();
              callback();
            }
          });
  
          addClass && pq.$(`${buttonId}-${pipeElement}`).attr("class", classToAdd);
        };
  
        switch (nextState) {
          case IDLE:
            // pipeRec
            removeButtonEvents("#pipeRec");
            addButtonEvents("#pipeRec", pipeStart, true, true);
  
            // pipePlay
            removeButtonEvents("#pipePlay", true);
  
            // pipeSaveVideo
            removeButtonEvents("#pipeSaveVideo", true);
  
            // pipeDownload
            removeButtonEvents("#pipeDownload", true);
  
            // pipeSwitchCam
            removeButtonEvents("#pipeSwitchCam");
            addButtonEvents("#pipeSwitchCam", switchCam, false, true);
            break;
  
          case RECORDING:
            // pipeRec
            removeButtonEvents("#pipeRec");
            addButtonEvents("#pipeRec", () => pipeStop(true), true, true);
  
            // pipePlay
            removeButtonEvents("#pipePlay", true);
  
            // pipeSwitchCam
            removeButtonEvents("#pipeSwitchCam", true);
  
            // pipeSaveVideo
            removeButtonEvents("#pipeSaveVideo", true);
  
            // pipeDownload
            removeButtonEvents("#pipeDownload", true);
            break;
  
          case PLAYING:
            // pipeRec
            removeButtonEvents("#pipeRec", true);
  
            // pipePlay
            removeButtonEvents("#pipePlay");
            addButtonEvents("#pipePlay", pipePausePlayback, true, true);
  
            // pipeSwitchCam
            removeButtonEvents("#pipeSwitchCam", true);
  
            // pipeSaveVideo
            removeButtonEvents("#pipeSaveVideo", true);
  
            // pipeDownload
            removeButtonEvents("#pipeDownload");
            addButtonEvents("#pipeDownload", pipeDownload, false, true);
            break;
  
          case STOPPED:
            // pipeRec
            removeButtonEvents("#pipeRec");
            addButtonEvents("#pipeRec", pipeStart, true, true);
  
            if (incomingDataHasSize == true) {
              // pipePlay
              removeButtonEvents("#pipePlay");
              addButtonEvents("#pipePlay", pipePlay, true, true);
            }
  
            // pipeSaveVideo
            if (pipeVars["asv"] == 0 && btSaveCanBeUsed == true) {
              removeButtonEvents("#pipeSaveVideo");
              addButtonEvents("#pipeSaveVideo", () => pipeSaveVideo(1), true, true);
            }
  
            // pipeDownload
            removeButtonEvents("#pipeDownload");
            addButtonEvents("#pipeDownload", pipeDownload, false, true);
  
            // pipeSwitchCam
            removeButtonEvents("#pipeSwitchCam");
            addButtonEvents("#pipeSwitchCam", switchCam, false, true);
            break;
  
          case PAUSED:
            // pipeRec
            removeButtonEvents("#pipeRec");
            addButtonEvents("#pipeRec", pipeStart, true, true);
  
            // pipePlay
            removeButtonEvents("#pipePlay");
            addButtonEvents("#pipePlay", pipePlay, true, true);
  
            // pipeSwitchCam
            removeButtonEvents("#pipeSwitchCam", true);
  
            if (pipeVars["asv"] == 0 && btSaveCanBeUsed == true) {
              // pipeSaveVideo
              removeButtonEvents("#pipeSaveVideo");
              addButtonEvents("#pipeSaveVideo", () => pipeSaveVideo(1), true, true);
            }
  
            // pipeDownload
            removeButtonEvents("#pipeDownload");
            addButtonEvents("#pipeDownload", pipeDownload, false, true);
            break;
  
          case DISABLED:
            // pipeRec
            removeButtonEvents("#pipeRec", true);
  
            // pipePlay
            removeButtonEvents("#pipePlay", true);
  
            // pipeSwitchCam
            removeButtonEvents("#pipeSwitchCam", true);
  
            // pipeSaveVideo
            removeButtonEvents("#pipeSaveVideo", true);
  
            // pipeDownload
            removeButtonEvents("#pipeDownload", true);
            break;
  
          case DISABLE_SAVE:
            // pipeSaveVideo
            removeButtonEvents("#pipeSaveVideo", true);
            break;
  
          case ENABLE_DOWNLOAD:
            // pipeDownload
            removeButtonEvents("#pipeDownload");
            addButtonEvents("#pipeDownload", pipeDownload, false, true);
            break;
        }
      }
  
      function switchCam(audioId = inputSelectedDevice.audio.deviceId, videoId) {
        stopMediaTracks(localStream);
  
        if (mobileCamUsed == "user") {
          mobileCamUsed = "environment";
  
          pq.$('#pipeVideoInput-' + pipeElement).attr("class", "pipeNormal");
          pq.$('#pipeSmallVideo-' + pipeElement).attr("class", "pipeSmallNormal");
        } else if (mobileCamUsed == "environment") {
          mobileCamUsed = "user";
  
          if (pipeVars["mv"] == 1) {
            pq.$('#pipeVideoInput-' + pipeElement).attr("class", "pipeMirrored");
            pq.$('#pipeSmallVideo-' + pipeElement).attr("class", "pipeSmallMirrored");
          } else {
            pq.$('#pipeVideoInput-' + pipeElement).attr("class", "pipeNormal");
            pq.$('#pipeSmallVideo-' + pipeElement).attr("class", "pipeSmallNormal");
          }
        }
        //custom style for border
        // document.getElementById("pipeVideoInput-"+pipeElement).removeAttribute("style");
        pq.$("#pipeVideoInput-" + pipeElement).css("borderTopLeftRadius", cornerRadius + "px").css("borderTopRightRadius", cornerRadius + "px").css("borderBottomLeftRadius", cornerRadiusNoMenu + "px").css("borderBottomRightRadius", cornerRadiusNoMenu + "px");
        //console.log("Switched to " + mobileCamUsed);
  
        if (mobile) {
          constraints = {
            audio: {
              noiseSuppression: noiseSuppressionVal,
              // Don't reset audio stream
              deviceId: audioId
            },
            video: {
              width: vidWidth,
              height: vidHeight,
              facingMode: mobileCamUsed
            }
          };
  
          if (videoId) {
            constraints.video.deviceId = videoId;
          }
  
          if (vidFrameRate != false) {
            constraints.video.frameRate = vidFrameRate;
          }
  
          console.log("pipe-log at " + timeStamp() + " calling getUserMedia with the following constraints: " + JSON.stringify(constraints));
  
          // Reset loading animation inside device selector if any active
          const resetDeviceLoadingAnimation = () => {
            // Audio and Video animation
            pq.$(`#pipeCircleSpinner-${audioId} #pipeCircleSpinner-${videoId}`).remove();
          };
  
          //we show the access message in case the permissions are in pending
          //pipeShowError(allowAccessTxt, 1);
          if (navigator.mediaDevices.getUserMedia) {
            ttaInit = Date.now();
            if (navigator.userAgent.toLowerCase().indexOf("android") != -1 && micGainValue > 1) {
              //for Android inline recorders we modify the mic gain
              navigator.mediaDevices.getUserMedia(constraints).then(function (recordingStream) {
                pipeGetUserMediaSuccess(modifyMicrophoneGain(recordingStream));
              }).catch(pipeOnError).finally(() => {
                resetDeviceLoadingAnimation();
              });
            } else {
              navigator.mediaDevices.getUserMedia(constraints).then(pipeGetUserMediaSuccess).catch(pipeOnError).finally(() => {
                resetDeviceLoadingAnimation();
              });
            }
          } else if (navigator.getUserMedia) {
            ttaInit = Date.now();
            navigator.getUserMedia(constraints, pipeGetUserMediaSuccess, pipeOnError);
          } else {
            console.log('Your browser does not support getUserMedia API');
          }
        }
      }
  
      /**
       * Function that adds a countdown circle animation with a number inside. It will be removed after one second.
       * @param {Number} number - The number to be shown inside the countdown circle.
       * @param {Boolean} [autoRemove=false] - If the element should remove itself or not.
       * @function
       */
      const pipeShowCountdownNumber = (number, autoRemove = false) => {
        // Check if there is another timer present - remove if so.
        pq.$("#pipeCountdownCircle-" + pipeElement).remove();
  
        // Container
        const countdownCircle = document.createElement("div");
        countdownCircle.id = "pipeCountdownCircle-" + pipeElement;
        const circleSize = parseInt(pipeVars["size"]["height"]) / 2 + "px";
        countdownCircle.style.height = circleSize;
        countdownCircle.style.width = circleSize;
        countdownCircle.className = "pipeCountdownCircleContainer";
  
        // Inner circle
        const innerCircle = '<svg><circle class="pipeCountdownCircle" cx="50%" cy="50%" r="100"></circle></svg><span>' + number + '</span>';
  
        // Add the inner circle inside the container
        countdownCircle.innerHTML = innerCircle;
  
        // Get the recording client in order to display the countdown on top
        document.getElementById("pipeVrec-" + pipeElement).appendChild(countdownCircle);
  
        if (!autoRemove) return;
        setTimeout(() => {
          countdownCircle.remove();
        }, 1000); // Remove automatically after 1 second
      };
  
      /**
       * Countdown function that displays the seconds remaining in the recording client.
       * @param {number} seconds - The number of seconds to count down.
       * @returns {Promise} A promise that resolves when the countdown is complete.
       * @function
       */
      const countdown = seconds => {
        // Return directly if "seconds" is 0 or smaller
        if (!seconds || seconds <= 0) return Promise.resolve();
  
        // Disable buttons
        pipeSetStatus(DISABLED);
  
        console.log("pipe-log at " + timeStamp() + " Countdown of " + seconds + " seconds started.");
        return new Promise(resolve => {
          pipeShowCountdownNumber(seconds, seconds === 1); // Display initial second
          const intervalId = setInterval(() => {
            seconds--;
  
            // Resolve and hide seconds on timer ending
            if (seconds <= 0) {
              clearInterval(intervalId);
              resolve();
            } else {
              pipeShowCountdownNumber(seconds, seconds === 1); // Remove countdown after last second
            }
          }, 1000);
        });
      };
  
      async function pipeStart() {
        console.log("pipe-log at " + timeStamp() + " record button pressed,  recorder state = " + state);
  
        // Disable the buttons that are only NOT required during the recording
        const disableRequiredButtons = () => {
          //Disable camera and mic icons
          micNumber > 0 && pq.$("#pipeMicIcon-" + pipeElement).switchClass("pipeInputSettingsButton", "pipeInputSettingsButtonDisabled");
          camNumber > 0 && pq.$("#pipeCamIcon-" + pipeElement).switchClass("pipeInputSettingsButton", "pipeInputSettingsButtonDisabled");
  
          // Hide input select menu
          pq.$('#pipeMediaSelectMenu-' + pipeElement).css("display", "none");
        };
  
        if (state == states.IDLE || state == states.RECORDED || state == states.PLAYED || state == states.PAUSED) {
          recordedChunks = [];
  
          // Remove video playback progress bar
          pq.$('#pipeProgressBarBorder-' + pipeElement).css("display", "none");
  
          pq.$("#pipeVideoInput-" + pipeElement).prop('muted', true);
          if (pq.$("#pipeVideoPlayback-" + pipeElement).css('display') != 'none') {
            pq.$("#pipeVideoPlayback-" + pipeElement).hide();
          }
  
          btSaveCanBeUsed = true;
  
          if (state == states.PAUSED) {
  
            //re-mirror the video if needed
            if (pipeVars["mv"] == 1 && mobileCamUsed == "user") {
              pq.$('#pipeVideoInput-' + pipeElement).attr("class", "pipeMirrored");
            } else {
              pq.$('#pipeVideoInput-' + pipeElement).attr("class", "pipeNormal");
            }
            //custom style for elements
            // document.getElementById("pipeVideoInput-"+pipeElement).removeAttribute("style");
            pq.$("#pipeVideoInput-" + pipeElement).css("borderTopLeftRadius", cornerRadius + "px").css("borderTopRightRadius", cornerRadius + "px").css("borderBottomLeftRadius", cornerRadiusNoMenu + "px").css("borderBottomRightRadius", cornerRadiusNoMenu + "px");
  
            pq.$("#pipeVideoInput-" + pipeElement).prop('muted', true);
  
            pipeSetState(states.PLAYED);
  
            pq.$('#pipePlay-' + pipeElement).attr("title", playBtnTxt).html(playIcon);
  
            clearInterval(recordCounter);
            clearInterval(playStreamCounter);
            actualPlaybackTime = 0;
  
            //pipeSetStatus(STOPPED);
  
            //remove picture in picture and re-init recorder
            pq.$("#pipeSmallVideo-" + pipeElement).animate({
              left: '0px',
              top: '0px',
              height: pipeVars["size"]["height"] - menuH + 'px',
              width: pipeVars["size"]["width"]
            }, 250);
  
            setTimeout(function () {
              pq.$("#pipeSmallVideo-" + pipeElement).hide();
            }, 250);
  
            if (pipeRecorderRemoved == false) {
              //re-init recorder
              try {
                videoInput.srcObject = localStream;
              } catch (e) {
                videoInput.src = URL.createObjectURL(localStream);
              }
            }
          }
  
          //event API call
          PipeSDK.recorders[pipeElement].btRecordPressed(pipeElement);
  
          autoStopped = false;
  
          //get devices again in case something changed
          micNumber = 0;
          camNumber = 0;
          try {
            [micNumber, camNumber] = await getDevicesCount();
            // Update the recording options
            updateRecordingOptions(camNumber === 0 && !recordingScreen ? "audio" : "video");
  
            console.log("pipe-log at " + timeStamp() + " initializing MediaRecorder with options: " + JSON.stringify(recordingOptions));
            pipeMediaRecorder = new MediaRecorder(localStream, recordingOptions);
            pipeMediaRecorder.onstart = handleMediaRecorderStart;
            pipeMediaRecorder.onstop = handleMediaRecorderStop;
            pipeMediaRecorder.ondataavailable = handleMediaRecorderDataAvailable;
            pipeMediaRecorder.onwarning = handleMediaRecorderWarning;
            pipeMediaRecorder.onerror = handleMediaRecorderError;
  
            // Set video encoding in stats for nerds
            pq.$("#mediarecorderEncoding-" + pipeElement).text(pipeMediaRecorder.mimeType);
            pq.$("#videoEncoding-" + pipeElement).text(recordingOptions.mimeType);
  
            // Set audio track settings in stats for nerds currentAudioSettings
            const currentAudioTracks = localStream.getAudioTracks()[0];
            if (currentAudioTracks) {
              pq.$("#currentAudioSettings-" + pipeElement).text(JSON.stringify(currentAudioTracks.getSettings()));
            }
  
            /**
             * Function to be called when recording starts. On recording button clicked or after timeout
             * @function
            */
            const startRecording = () => {
  
              // Reset fallback flag
              retryRecordingWithFallback = false;
  
              if (recordingScreen == false) {
                if (micNumber != 0 || camNumber != 0 && pipeVars["ao"] == 0) {
                  //re-init the buffer
                  buffer = [];
  
                  pipeMediaRecorder.start(timeSlice);
  
                  pipeSetState(states.RECORDING);
                  pipeSetStatus(DISABLED);
                  disableRequiredButtons();
                } else {
                  if (pipeVars["ao"] == 1) {
                    pipeShowMessage(noMicTxt);
                  } else {
                    pipeShowMessage(noCameraTxt);
                  }
                }
              } else {
  
                localStream.getVideoTracks().forEach(function (track) {
                  //console.log(track);  
                  screenReadyState = track.readyState;
                });
  
                if (screenReadyState == "live") {
                  //re-init the buffer
                  buffer = [];
  
                  pipeMediaRecorder.start(timeSlice);
  
                  pipeSetState(states.RECORDING);
                  pipeSetStatus(DISABLED);
                  disableRequiredButtons();
                } else {
                  return pipeShowError(screenPermissionTxt);
                }
              }
            };
  
            // Do not allow device changes
            disableRequiredButtons();
  
            // Reset the timer to 0 if not in size view
            if (!timerSwitchToSize) {
              if (pipeVars["timertype"] == 1) {
                // Count-down timer
                updateTimer(digits(pipeVars["mrt"]));
              } else {
                // Count-up timer
                updateTimer("00:00", digits(pipeVars["mrt"]));
              }
            }
  
            // If the recording is retried (retryRecordingWithFallback=true) due to a fallback, there is no need for a countdown again.
            const countdowntimer = retryRecordingWithFallback ? 0 : parseInt(pipeVars["countdowntimer"]) >= 1 ? parseInt(pipeVars["countdowntimer"]) : 0;
  
            // Start countdown. If there is no countdown, start immediately
            countdown(countdowntimer).then(() => startRecording()).catch(error => {
              pipeSetStatus(IDLE); // Reset state on error
              console.log("pipe-log at " + timeStamp() + " An error occurred during countdown: ", error);
            });
          } catch (err) {
            // Some errors for MediaRecorder are not caught by MediaRecorder.onerror -> catch is needed
            console.log(err.name + ": " + err.message);
          }
        }
      }
  
      function pipeStop(manualTrigger = false) {
        const logMessage = manualTrigger ? " stop button pressed" : " stop action triggered";
        console.log("pipe-log at " + timeStamp() + logMessage + ",  recorder state = " + state);
  
        // Show input select menu
        document.getElementById('pipeMediaSelectMenu-' + pipeElement).style.removeProperty("display");
  
        //Enable camera and mic icons
        micNumber > 0 && pq.$("#pipeMicIcon-" + pipeElement).switchClass("pipeInputSettingsButtonDisabled", "pipeInputSettingsButton");
        pipeVars["ao"] != 1 && camNumber > 0 && pq.$("#pipeCamIcon-" + pipeElement).switchClass("pipeInputSettingsButtonDisabled", "pipeInputSettingsButton");
  
        if (state == states.RECORDING) {
  
          pipeSetStatus(DISABLED);
  
          pipeSetState(states.RECORDED);
  
          pq.$('#pipeRec-' + pipeElement).attr("title", recBtnTxt).html(recordIcon);
  
          clearInterval(recordCounter);
          clearInterval(streamCounter);
  
          try {
  
            pipeMediaRecorder.stop();
  
            const maxRecTime = statsForNerdsOpen ? pipeVars["mrt"] * 1000 : pipeVars["mrt"];
  
            if (lastStreamTime > maxRecTime) {
              lastStreamTime = maxRecTime + 1;
            }
  
            pipeSetStatus(ENABLE_DOWNLOAD);
  
            actualStreamTime = statsForNerdsOpen ? lastStreamTime / 1000 : lastStreamTime;
          } catch (e) {
            pipeOnError(e);
          }
  
          // Remove recording icon from timer
          addIconToTimer("NONE");
  
          //event API call
          PipeSDK.recorders[pipeElement].btStopRecordingPressed(pipeElement);
        }
      }
  
      /**
       * Downloads the recording locally.
       * @function
       */
      function pipeDownload() {
        console.log("pipe-log at " + timeStamp() + " download button pressed.");
  
        if (!recordedChunks || recordedChunks.length === 0) {
          console.log("pipe-log at " + timeStamp() + " No video available for download.");
          return;
        }
  
        const blob = new Blob(recordedChunks, { type: recordingOptions.mimeType });
        const url = URL.createObjectURL(blob);
  
        const downloadLink = document.createElement('a');
        downloadLink.href = url;
        downloadLink.download = newFileName + "." + streamExtension;
        downloadLink.click();
      }
  
      function pipePlay() {
        console.log("pipe-log at " + timeStamp() + " play button pressed,  recorder state = " + state);
  
        // Add video playback progress bar
        pq.$("#pipeProgressBarBorder-" + pipeElement).css("display", "flex");
  
        if (state == states.RECORDED || state == states.PLAYED || state == states.IDLE) {
  
          // Reset progress of playback progress bar
          pq.$("#pipeProgressBar-" + pipeElement).css("width", "0%");
          playbackSeekPosition = 0;
  
          try {
            videoInput.srcObject = null;
          } catch (e) {}
  
          videoPlayback.src = "https://" + html5Server + "/v_rtc/" + newFileName + "." + streamExtension;
  
          videoPlayback.load();
          if (pq.$("#pipeVideoPlayback-" + pipeElement).css('display') == 'none') {
            pq.$("#pipeVideoPlayback-" + pipeElement).show();
          }
  
          videoPlayback.play();
  
          pipeShowMessage(bufferingTxt);
  
          pq.$("#pipeSmallVideo-" + pipeElement).show().animate({
            left: "81.5%",
            top: pipeVars["size"]["height"] - pipeVars["size"]["height"] / 6 - 40 + 'px',
            height: pipeVars["size"]["height"] / 6 + 'px',
            width: 100 / 6 + "%"
          }, 250);
  
          //unmirror video if needed
          if (pipeVars["mv"] == 1) {
            pq.$('#pipeVideoInput-' + pipeElement).attr("class", "pipeNormal");
            if (mobileCamUsed == "user") {
              pq.$('#pipeSmallVideo-' + pipeElement).attr("class", "pipeSmallMirrored");
            }
  
            // document.getElementById("pipeVideoInput-"+pipeElement).removeAttribute("style");
            pq.$("#pipeVideoInput-" + pipeElement).css("borderTopLeftRadius", cornerRadius + "px").css("borderTopRightRadius", cornerRadius + "px").css("borderBottomLeftRadius", cornerRadiusNoMenu + "px").css("borderBottomRightRadius", cornerRadiusNoMenu + "px");
          }
  
          pipeSetState(states.PLAYING);
  
          pq.$('#pipePlay-' + pipeElement).attr("title", pauseBtnTxt).html(pauseIcon);
  
          pipeSetStatus(DISABLED);
  
          pipeSetStatus(PLAYING);
  
          lastStreamTime = 0;
  
          playStreamStartTime = Date.now();
          playStreamCounter = setInterval(pipePlayStreamCounter, 100);
          intervals.push(playStreamCounter);
  
          //and show the local video in the small video input
          try {
            smallVideoInput.srcObject = localStream;
          } catch (e) {
            smallVideoInput.src = URL.createObjectURL(localStream);
          }
        } else if (state == states.PAUSED) {
  
          videoPlayback.play();
  
          //unmirror video if needed
          if (pipeVars["mv"] == 1) {
            pq.$('#pipeVideoInput-' + pipeElement).attr("class", "pipeNormal");
  
            // document.getElementById("pipeVideoInput-"+pipeElement).removeAttribute("style");
            pq.$("#pipeVideoInput-" + pipeElement).css("borderTopLeftRadius", cornerRadius + "px").css("borderTopRightRadius", cornerRadius + "px").css("borderBottomLeftRadius", cornerRadiusNoMenu + "px").css("borderBottomRightRadius", cornerRadiusNoMenu + "px");
          }
  
          //jQuery("#pipeVideoInput-"+pipeElement).prop('muted', false);
          if (pq.$("#pipeVideoPlayback-" + pipeElement).css('display') == 'none') {
            pq.$("#pipeVideoPlayback-" + pipeElement).show();
          }
          pipeSetState(states.PLAYING);
  
          pipeSetStatus(PLAYING);
  
          playStreamStartTime = Date.now();
          playStreamCounter = setInterval(pipePlayStreamCounter, 100);
          intervals.push(playStreamCounter);
  
          pq.$('#pipePlay-' + pipeElement).attr("title", pauseBtnTxt).html(pauseIcon);
        }
  
        // Start progress bar of playback
        requestAnimationFrame(updatePlaybackProgressBar);
        // Add event listener for seek in playback mode
        mobile ? document.addEventListener("touchend", handleProgressBarTouchEnd) : document.addEventListener("mouseup", handleProgressBarDragEnd);
  
        //event API call
        PipeSDK.recorders[pipeElement].btPlayPressed(pipeElement);
      }
  
      function pipeStopPlayer() {
        console.log("pipe-log at " + timeStamp() + " playback stopped,  recorder state = " + state);
  
        // Show input select menu
        document.getElementById('pipeMediaSelectMenu-' + pipeElement).style.removeProperty("display");
  
        if (state == states.PLAYING || state == states.PAUSED) {
  
          // Remove video playback progress bar
          pq.$("#pipeProgressBarBorder-" + pipeElement).css("display", "none");
          // Remove event listener for seek in playback mode
          mobile ? document.removeEventListener("touchend", handleProgressBarTouchEnd) : document.removeEventListener("mouseup", handleProgressBarDragEnd);
  
          //re-mirror the video if needed
          if (pipeVars["mv"] == 1 && mobileCamUsed == "user") {
            pq.$('#pipeVideoInput-' + pipeElement).attr("class", "pipeMirrored");
          } else {
            pq.$('#pipeVideoInput-' + pipeElement).attr("class", "pipeNormal");
          }
          //custom style for elements
          // document.getElementById("pipeVideoInput-"+pipeElement).removeAttribute("style");
          pq.$("#pipeVideoInput-" + pipeElement).css("borderTopLeftRadius", cornerRadius + "px").css("borderTopRightRadius", cornerRadius + "px").css("borderBottomLeftRadius", cornerRadiusNoMenu + "px").css("borderBottomRightRadius", cornerRadiusNoMenu + "px");
  
          pq.$("#pipeVideoInput-" + pipeElement).prop('muted', true);
          if (pq.$("#pipeVideoPlayback-" + pipeElement).css('display') != 'none') {
            pq.$("#pipeVideoPlayback-" + pipeElement).hide();
          }
          pipeSetState(states.PLAYED);
  
          pq.$('#pipePlay-' + pipeElement).attr("title", playBtnTxt).html(playIcon);
  
          clearInterval(playStreamCounter);
          actualPlaybackTime = 0;
  
          pipeSetStatus(STOPPED);
  
          //event API call
          PipeSDK.recorders[pipeElement].onPlaybackComplete(pipeElement);
  
          //remove picture in picture and re-init recorder
          pq.$("#pipeSmallVideo-" + pipeElement).animate({
            left: '0px',
            top: '0px',
            height: pipeVars["size"]["height"] - menuH + 'px',
            width: '100%'
          }, 250);
  
          setTimeout(function () {
            pq.$("#pipeSmallVideo-" + pipeElement).hide();
  
            if (pipeRecorderRemoved == false) {
  
              //re-init recorder
              try {
                videoInput.srcObject = localStream;
              } catch (e) {
                videoInput.src = URL.createObjectURL(localStream);
              }
            }
          }, 250);
        }
      }
  
      function pipePausePlayback() {
        // Show input select menu
        document.getElementById('pipeMediaSelectMenu-' + pipeElement).style.removeProperty("display");
  
        videoPlayback.pause();
      }
  
      // Check if this is bug on Safari - onDeviceChange being called on startup (false alarm)
      let initialCallSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
  
      navigator.mediaDevices.ondevicechange = function (event) {
        //console.log("pipe-log at " + timeStamp() + " ondevicechange");
  
        if (localStream != null) {
          localStream.getTracks().forEach(function (track) {
            //console.log(track);
            if (track.kind == "audio") {
              console.log("pipe-log at " + timeStamp() + " ondevicechange triggered, audio track settings:" + JSON.stringify(track.getSettings()));
            }
          });
        }
  
        // Get list of old devices
        const oldDevices = inputDeviceList.audio.concat(inputDeviceList.video);
  
        // Populate media input devices list
        getMediaInputs().then(fetchedDeviceList => {
          const mergedFetchedDeviceList = fetchedDeviceList.audio.concat(fetchedDeviceList.video);
          // Check if devices have groupId - some browsers do not provide it -> using deviceId instead
          let idToCheck = mergedFetchedDeviceList.some(dev => dev.groupId !== "") ? "groupId" : "deviceId";
          if (idToCheck === "groupId" && inputSelectedDevice.audio && !inputSelectedDevice.audio.groupId) {
            idToCheck = "deviceId";
          }
  
          // Function to remove any devices from the disconnected list if reconnected 
          function removeMatchingObjects(array1, array2) {
            const groupIds = new Set(array1.map(obj => obj[idToCheck]));
            return array2.filter(obj => !groupIds.has(obj[idToCheck]));
          }
          const mergedDisconnectedArray = inputDisconnectedDevices.audio.concat(inputDisconnectedDevices.video);
          if (mergedDisconnectedArray.length > 0) {
            const newDisconnectedList = removeMatchingObjects(mergedFetchedDeviceList, mergedDisconnectedArray);
            inputDisconnectedDevices.audio = newDisconnectedList.filter(dev => dev.kind === "audioinput");
            inputDisconnectedDevices.video = newDisconnectedList.filter(dev => dev.kind === "videoinput");
          }
  
          // Function to find disconnected devices 
          function findDisconnected(newDeviceList, oldDeviceList) {
            const newIds = newDeviceList.length > 0 ? new Set(newDeviceList.map(obj => obj[idToCheck])) : new Set();
            const newNames = newDeviceList.length > 0 ? new Set(newDeviceList.map(obj => obj.label)) : new Set();
            return [...oldDeviceList].filter(obj => !newIds.has(obj[idToCheck]) && !newNames.has(obj.label)).map(dev => {
              const origIdx = [...oldDeviceList].filter(d => d.kind === dev.kind).findIndex(d => d.deviceId === dev.deviceId);
              dev.originalIndex = origIdx < 0 ? newDeviceList.length + 1 : origIdx;
              return dev;
            });
          }
          const disconnectedDeviceList = findDisconnected(mergedFetchedDeviceList, oldDevices);
          inputDisconnectedDevices.audio.push(...disconnectedDeviceList.filter(dev => dev.kind === "audioinput" && dev.deviceId !== "default" && dev.deviceId !== "communications"));
          inputDisconnectedDevices.video.push(...disconnectedDeviceList.filter(dev => dev.kind === "videoinput"));
  
          // Using Sets to avoid duplicates to be displayed in the list
          inputDisconnectedDevices.audio = [...new Set(inputDisconnectedDevices.audio)];
          inputDisconnectedDevices.video = [...new Set(inputDisconnectedDevices.video)];
  
          // Add notification next to cog wheel depending on device change
          if (oldDevices.length !== mergedFetchedDeviceList.length && !initialCallSafari) {
            function setNotification(type, category, force = false) {
              if (!force && inputMenuCurrentlyOpen === category) return;
  
              const notificationIcon = document.getElementById(`pipeNotification${category}-${pipeElement}`);
              if (!notificationIcon) return;
  
              const notificationColors = {
                connect: "#23c552", // green
                disconnect: "#edae3c" // red
              };
  
              notificationIcon.style.background = notificationColors[type] || "#23c552";
              notificationIcon.style.display = "block";
            }
  
            // Devices were disconnected
            if (mergedFetchedDeviceList.length < oldDevices.length) {
              if (disconnectedDeviceList.some(dev => dev.kind === "audioinput")) {
                setNotification("disconnect", "audio");
              }
              if (disconnectedDeviceList.some(dev => dev.kind === "videoinput")) {
                setNotification("disconnect", "video");
              }
            }
            // New devices were connected
            else {
                const newDevicesList = mergedFetchedDeviceList.filter(dev => !oldDevices.some(oldDev => oldDev[idToCheck] === dev[idToCheck]));
                if (newDevicesList.some(dev => dev.kind === "audioinput")) {
                  setNotification("connect", "audio");
                }
                if (newDevicesList.some(dev => dev.kind === "videoinput")) {
                  setNotification("connect", "video");
                }
              }
          }
  
          // Set initial call on safari to false since it passed the initial check
          initialCallSafari = false;
  
          // Remove disconnected devices after the timeout duration
          disconnectedDeviceList.forEach(val => {
            setTimeout(() => {
              const devType = val.kind === "audioinput" ? "audio" : "video";
              const idxToRemove = inputDisconnectedDevices[devType].indexOf(val);
              if (idxToRemove > -1) {
                inputDisconnectedDevices[devType].splice(idxToRemove, 1);
                // Disable camera select button if all cameras are unavailable
                if (devType === "video" && inputDisconnectedDevices.video.length === 0 && inputDeviceList.video.length === 0) {
                  const cameraButton = document.getElementById("pipeCamIcon-" + pipeElement);
                  if (cameraButton) {
                    // First close the menu if it is open - use force
                    inputMenuCurrentlyOpen === "video" && toggleInputMenu("video", true);
                    // Disable video button
                    cameraButton.classList.replace("pipeInputSettingsButton", "pipeInputSettingsButtonDisabled");
                  }
                }
                // Remove notification after device is removed from the list
                pq.$("#pipeNotification" + devType + "-" + pipeElement).css("display", "none");
              }
              // Reset UI
            }, inputDisconnectTimer);
          });
  
          // During the recording - only update list in menu if new devices and notifications - do not update stream
          if (state === states.RECORDING) return;
  
          // Check if stream needs to be reset
          let streamNeedsReset = false;
  
          // Check if the disconnected devices were used and reset the values if so
          const resetDevicesInUse = type => {
            if (!inputSelectedDevice[type] || disconnectedDeviceList.some(val => val[idToCheck] === inputSelectedDevice[type][idToCheck])) {
              inputSelectedDevice[type] = fetchedDeviceList[type].length > 0 ? fetchedDeviceList[type][0] : null;
              inputSelectedDevice[type] && console.log("pipe-log at " + timeStamp() + ' Changed selected ' + type + ' device to: ' + inputSelectedDevice[type].label);
              streamNeedsReset = state !== states.RECORDING;
            }
          };
          resetDevicesInUse("audio");
          resetDevicesInUse("video");
  
          // Check if selected device id is default and update if there is a new default id - only if not disconnected    
          function updateSelectedDefaultDevice(deviceType) {
            const inputDevice = inputSelectedDevice[deviceType];
            if (!inputDevice) return;
            // Only check if device is connected
            if (disconnectedDeviceList.some(val => val[idToCheck] === (inputDevice[idToCheck] || null))) return;
            // Check if the device was "default" -> always get default stream
            const idFromDevice = inputDevice.deviceId || null;
            if (!inputDevice || idFromDevice !== "default" && idFromDevice !== "communications") return;
            const fetchedDevice = fetchedDeviceList[deviceType].find(dev => dev.deviceId === idFromDevice);
            if (!fetchedDevice) return;
            if (state === states.RECORDING) {
              // Do not change stream if recording is on
              if (fetchedDevice.groupId !== inputDevice.groupId) {
                const newSelectedDevice = fetchedDeviceList[deviceType].find(dev => dev.groupId === inputDevice.groupId);
                inputSelectedDevice[deviceType] = newSelectedDevice;
              }
            } else {
              // Get stream of current "default" device if it changed
              inputSelectedDevice[deviceType] = fetchedDevice;
              streamNeedsReset = true;
            }
          }
          updateSelectedDefaultDevice("audio");
  
          // Enable camera select button if cameras available - also update recording options
          if (pipeVars["ao"] != 1 && camNumber === 0 && fetchedDeviceList.video.length > 0) {
            const cameraButton = document.getElementById("pipeCamIcon-" + pipeElement);
            if (cameraButton) {
              cameraButton.classList.replace("pipeInputSettingsButtonDisabled", "pipeInputSettingsButton");
              inputSelectedDevice.video = fetchedDeviceList.video[0];
              streamNeedsReset = true;
              pq.$("#pipeAudioOnly-" + pipeElement).remove();
              updateRecordingOptions("video");
            }
          }
          // Update recording options to audio only
          else if (pipeVars["ao"] != 1 && camNumber > 0 && fetchedDeviceList.video.length === 0) {
              updateRecordingOptions("audio");
              // Remove camera tooltip
              pq.$("#pipeCamContainer-" + pipeElement).prop("title", "");
              //add audio-only thumbnail
              pq.$(audioOnlySVG).insertBefore("#pipeVideoInput-" + pipeElement);
              // Deactivate no camera message (if any) in audio only mode
              const messageText = document.querySelector('#pipeMsgOverlay-' + pipeElement + ' > *');
              if (messageText && messageText.innerText === camUsedTxt) {
                pipeHideMessage();
                // Enable mic icon
                pq.$("#pipeMicIcon-" + pipeElement).switchClass("pipeInputSettingsButtonDisabled", "pipeInputSettingsButton");
                pq.$("#pipeMicContainer-" + pipeElement).click(() => {
                  toggleInputMenu("audio");
                });
                pipeSetStatus(IDLE);
                streamNeedsReset = true;
              }
            }
  
          // Reset cam and mic number
          micNumber = fetchedDeviceList.audio.length;
          camNumber = fetchedDeviceList.video.length;
  
          populateInputSelectList("any", fetchedDeviceList, streamNeedsReset);
        });
      };
  
      /**
       * Handles errors that may occur.
       * It emits an error event to the socket, logs the error, and performs specific actions based on the error type.
       * @param {Error} error - The error object representing the error that occurred.
       */
      function pipeOnError(error) {
        if (!error) return;
  
        ttaResult = Date.now();
  
        // Send error information to socket based on the context of the error
        const errorPayload = {
          name: error.name,
          message: error.message,
          accHash: pipeVars["accountHash"],
          eid: pipeVars["eid"] ? pipeVars["eid"] : "1",
          tta: ttaResult - ttaInit
        };
  
        if (cam !== "" || mic !== "") {
          // Sending "accountHash" and "environmentId" (eid) with "pipeOnError" is deprecated.
          errorPayload.cameraName = cam;
          errorPayload.microphoneName = mic;
        } else if (camPerm !== "" || micPerm !== "") {
          // Sending "accountHash" and "environmentId" (eid) with "pipeOnError" is deprecated.
          errorPayload.camPerm = camPerm;
          errorPayload.micPerm = micPerm;
        }
  
        // Emit error event to socket
        socket.emit("pipeOnError", errorPayload);
  
        // Reset fallback flag
        retryRecordingWithFallback = false;
  
        // Perform specific actions based on the error type
        switch (error.name) {
          case 'PermissionDeniedError':
          case 'NotAllowedError':
            //pipeSetStatus(DISABLED);
  
            if (recordingScreen == false) {
              pipeShowError(blockedTxt);
            } else {
              pipeShowError(screenPermissionTxt);
            }
  
            //event API call
            PipeSDK.recorders[pipeElement].onCamAccess(pipeElement, false);
            break;
          case 'TrackStartError':
          case 'NotReadableError':
          case 'AbortError':
            if (error.message.indexOf("video") != -1 || error.message === "Device in use") {
              pipeShowMessage(camUsedTxt);
              if (state === states.INIT) {
                // Disable mic icon
                micNumber > 0 && pq.$("#pipeMicIcon-" + pipeElement).switchClass("pipeInputSettingsButton", "pipeInputSettingsButtonDisabled");
                pq.$("#pipeMicContainer-" + pipeElement).unbind("click");
                pipeSetStatus(DISABLED);
                pipeGetUserMediaSuccess(); // undefined stream
              }
            } else {
              pipeShowMessage(noMicTxt);
              pipeGetUserMediaSuccess(); // undefined stream
            }
            break;
          case 'NotFoundError':
            //pipeSetStatus(DISABLED);
            if (recordingScreen == false) {
              if (pipeVars["ao"] == 1) {
                pipeShowMessage(noMicTxt);
                pipeGetUserMediaSuccess(); // undefined stream
              } else {
                pipeShowMessage(noCameraTxt);
                pipeGetUserMediaSuccess(); // undefined stream
              }
            } else {
              if (micNumber > 0) {
                pipeShowMessage(noMicTxt);
                pipeGetUserMediaSuccess(); // undefined stream
              } else {
                pipeShowError(screenPermissionTxt);
              }
            }
            break;
          // MediaRecorderErrorEvent
          case 'InvalidStateError':
          case 'SecurityError':
          case 'NotSupportedError':
          case 'InvalidModificationError':
          case 'UnknownError':
            console.log("pipe-log at " + timeStamp() + " " + error.name + " " + error.message);
            // Even though isTypeSupported() returns true some devices will fail to encode H.264 at higher resolutions (>= 720p)
            // Thatâ€™s why we implemented a fallback to a lower resource intensive codec
            if (error.message === "Video encoding failed." && recordingOptions.mimeType !== "video/webm;codecs=vp8" && recordingOptions.mimeType !== "video/mp4") {
              // Fallback encoding
              videoEncoding = ";codecs=vp8";
              updateRecordingOptions("video");
  
              // Check if the recording has any size
              if (totalStreamSize > 0) {
                // Stopping failed recording and do not start a new one automatically
                pipeStop();
              } else {
                // Reset "pipeMediaRecorder.onstop" in order not to trigger the "handleMediaRecorderStop" function
                // Reset the state in order to allow a new recording to start
                pipeMediaRecorder.onstop = null;
                pipeSetState(states.IDLE);
  
                // Retry recording with different encoding instantly
                console.log("pipe-log at " + timeStamp() + " Retrying recording with the following encoding: " + recordingOptions.mimeType);
                retryRecordingWithFallback = true;
                pipeStart();
              }
            } else {
              pipeShowError(error.name + " occurred");
            }
            break;
          case 'OverconstrainedError':
            pipeShowError("OverconstrainedError occurred");
            console.log("pipe-log at " + timeStamp() + " " + error.name + ": " + error.constraint + " " + error.message);
            break;
          default:
            pipeShowError("Unexpected error occurred");
            console.log("pipe-log at " + timeStamp() + " " + error.name + " " + error.message);
            break;
        }
      }
  
      socket.on('videoSaved', function (msg) {
        pipeShowMessage(savedTxt);
        setTimeout(pipeHideMessage, 1000);
  
        // The audio codec is taken from MediaRecorder mimeType if available. 
        // If not, "aac" is hardcoded for Safari and "opus" for the rest of the browsers (Firefox)
        let audioCodec = isSafariOnMac ? "aac" : "opus";
        if (pipeMediaRecorder.mimeType.split('=')[1]) {
          audioCodec = pipeMediaRecorder.mimeType.split('=')[1].split(',')[1];
        }
  
        // The video codec will be taken from the mimeType if available (always available on Chrome[116], event with fallback)
        // If not, "h264" is hardcoded for Safari and "vp8" for the rest of the browsers (Firefox)
        const videoCodecMatch = recordingOptions.mimeType.match(/=(\w+)/);
        const videoCodec = videoCodecMatch ? videoCodecMatch[1] : isSafariOnMac ? "h264" : "vp8";
  
        //event API call
        if (pipeVars["ao"] == 1) {
          PipeSDK.recorders[pipeElement].onSaveOk(pipeElement, newFileName, streamElapsedTime, cam, mic, audioCodec, videoCodec, streamExtension, msg.videoId, true, storageS3Location);
        } else {
          PipeSDK.recorders[pipeElement].onSaveOk(pipeElement, newFileName, streamElapsedTime, cam, mic, audioCodec, videoCodec, streamExtension, msg.videoId, false, storageS3Location);
        }
      });
  
      /**
       * 
       * @param {number} source - The source of the call | 0 - autosave | 1 - manual UI | 2 - manual API |
       */
      function pipeSaveVideo(source = 0) {
        const logMessage = source !== 0 ? " save pressed" : " save triggered";
        console.log("pipe-log at " + timeStamp() + logMessage + ", streamName: " + newFileName);
  
        if (incomingDataHasSize == false) {
          return;
        }
  
        pipeShowMessage(savingTxt);
  
        btSaveCanBeUsed = false;
  
        if (sumMicLevel != 0) {
          avgMicLevel = Math.round(sumMicLevel / nrOfMicLevelCalls * 100) / 100;
        } else {
          avgMicLevel = 0;
        }
  
        autoSaveVid = 0;
        if (pipeVars["asv"] == 1 || pipeVars["asv"] == undefined) {
          autoSaveVid = 1;
        }
  
        audioOnly = 0;
        if (pipeVars["ao"] == 1) {
          audioOnly = 1;
        }
  
        const sourceString = source === 1 ? "manual_ui" : source === 2 ? "manual_api" : "autosave";
  
        // Sending "accountHash" and "environmentId" with "saveVideo" is deprecated.
        var saveData = {
          'streamName': newFileName,
          'streamDuration': streamElapsedTime,
          'micLevel': avgMicLevel,
          'micMuted': micMuted,
          'micReadyState': micReadyState,
          'camMuted': camMuted,
          'camReadyState': camReadyState,
          'autoSave': autoSaveVid,
          'accountHash': pipeVars["accountHash"],
          'payload': pipeVars["payload"] ? pipeVars["payload"] : '',
          'httpReferer': window.location.href,
          'environmentId': pipeVars["eid"] ? pipeVars["eid"] : '1',
          'cameraName': cam,
          'microphoneName': mic,
          'audioOnly': audioOnly,
          'source': sourceString
        };
  
        socket.emit('saveVideo', saveData);
  
        pipeSetStatus(DISABLE_SAVE);
      }
  
      function pipeShowMessage(msg, width = 30, pos = "center") {
  
        if (document.getElementById('pipeMsgOverlay-' + pipeElement) != null) {
          if (pos == "center") {
            pq.$("#pipeMsgOverlay-" + pipeElement).switchClass("pipeTopMessage", "pipeMsgOverlay").css("top", (pipeVars["size"]["height"] - 50) / 2 + "px").css("width", width * 1.6 + "%");
          } else if (pos == "top") {
            pq.$("#pipeMsgOverlay-" + pipeElement).switchClass("pipeMsgOverlay", "pipeTopMessage").css("top", "0px").css("width", width * 2 + "%");
          }
  
          pq.$('#pipeMsgOverlay-' + pipeElement).html('<div style="overflow-wrap: break-word;">' + msg + '</div>').show();
  
          if (pos === "top") {
            // Move timer a bit down
            pq.$("#pipeCounter-" + pipeElement).css("top", document.getElementById('pipeMsgOverlay-' + pipeElement).offsetHeight + 5 + "px");
          }
        }
  
        pq.$("#pipeAudioOnly-" + pipeElement).hide();
      }
  
      function pipeHideMessage() {
        pq.$("#pipeMsgOverlay-" + pipeElement).hide();
        pq.$("#pipeAudioOnly-" + pipeElement).show();
  
        // Move timer back to the top
        pq.$("#pipeCounter-" + pipeElement).css("top", "5px");
      }
  
      function pipeShowError(msg, add = 0, messageIsBtn = 0) {
  
        if (document.getElementById(pipeElement) != null) {
          if (add == 0) {
            pq.$("#" + pipeElement).html('<div id="pipeError-' + pipeElement + '" class="pipeError"><p>' + msg + '</p></div>');
            pq.$("#pipeError-" + pipeElement).show();
          } else {
  
            var messageAttributes = "";
            if (messageIsBtn == 1) {
              messageAttributes = 'id="srecMessage-' + pipeElement + '" class="pipeBtn" style="color:#58acfc;text-decoration:underline;"';
            }
  
            pq.$('#' + pipeElement).append('<div id="pipeError-' + pipeElement + '" class="pipeError"><p ' + messageAttributes + '>' + msg + '</p></div>');
            pq.$("#pipeError-" + pipeElement).fadeIn(450);
          }
          pq.$("#pipeError-" + pipeElement).css("width", pipeVars["size"]["width"]).css("height", pipeVars["size"]["height"] + "px").css("borderRadius", cornerRadius);
        }
  
        if (localStream) {
          localStream.getTracks().forEach(function (track) {
            track.stop();
          });
          localStream = null;
        }
      }
  
      /**
       * Updates the recording time and checks if recording should be stopped.
       * @function
       */
      function pipeCounter() {
  
        // Get the current time since the recording stopped
        const currentTime = Date.now();
        timeSinceRecBtnPressed = Math.floor((currentTime - streamStartTime) / 1000);
  
        // Enable the stop button after 2 seconds
        if (timeSinceRecBtnPressed >= 2) {
          pipeSetStatus(RECORDING);
          if (!incomingDataHasSize) {
            pipeStop();
            pipeShowMessage("Device error: no audio or video data", 85);
  
            socket.emit('pipeNoData', { 'msg': "Device error: no audio or video data", 'cameraName': cam, 'microphoneName': mic });
          }
        }
  
        // Increase streamTimeNoData and return if not data available
        if (!incomingDataHasSize) {
          streamTimeNoData += statsForNerdsOpen ? timeSlice / 1000 : 1; // If SFN is open, increase amount according to timeslice converted in seconds, else 1 second.
          return;
        }
        const divider = statsForNerdsOpen ? 1 : 1000; // Get ms if stats for nerds is open
        const multiplier = statsForNerdsOpen ? 1000 : 1; // Get ms if stats for nerds is open
  
        // Get stream time minus time where no data was available
        lastStreamTime = Math.floor((currentTime - streamStartTime) / divider) - streamTimeNoData * multiplier;
  
        // Check for value to no be negative
        if (lastStreamTime < 0) lastStreamTime = 0;
  
        // Stop stream if current recording is equal/longer than maximum allowed time
        if (lastStreamTime >= pipeVars["mrt"] * multiplier) {
          autoStopped = true;
          pipeStop();
        }
  
        // Update UI timer if in timer view
        if (!timerSwitchToSize) {
          if (pipeVars["timertype"] == 1) {
            // Count-down timer
            updateTimer(digits(pipeVars["mrt"] * multiplier - lastStreamTime));
          } else {
            // Count-up timer
            updateTimer(digits(lastStreamTime), digits(pipeVars["mrt"] * multiplier));
          }
        }
      }
  
      function pipeStreamCounter() {
        if (incomingDataHasSize == true) {
          streamElapsedTime = parseFloat(((Date.now() - streamStartTime) / 1000).toFixed(2));
        }
      }
  
      function pipePlayStreamCounter() {
        playStreamElapsedTime = actualPlaybackTime + (Date.now() - playStreamStartTime);
      }
  
      // No longer used
      // function visitPipe(){
      //   window.location.href="https://addpipe.com?ref=expired";
      // }
  
      function refPipe() {
        window.location.href = "https://addpipe.com?ref=embed";
      }
  
      // ====== JS Control API ======
  
      PipeSDK.recorders[pipeElement].record = function () {
        if (pq.$('#pipeError-' + pipeElement).length == 0 && pq.$("#pipeRec-" + pipeElement).hasClass("pipeBtn") && state != states.RECORDING) {
          pipeStart();
        }
      };
  
      PipeSDK.recorders[pipeElement].stopVideo = function () {
        if (pq.$('#pipeError-' + pipeElement).length == 0 && pq.$("#pipeRec-" + pipeElement).hasClass("pipeBtn") && state == states.RECORDING) {
          pipeStop(true);
        }
      };
  
      PipeSDK.recorders[pipeElement].playVideo = function () {
        if (pq.$('#pipeError-' + pipeElement).length == 0 && pq.$("#pipePlay-" + pipeElement).hasClass("pipeBtn") && state != states.PLAYING) {
          pipePlay();
        }
      };
  
      PipeSDK.recorders[pipeElement].pause = function () {
        if (pq.$('#pipeError-' + pipeElement).length == 0 && pq.$("#pipePlay-" + pipeElement).hasClass("pipeBtn") && state == states.PLAYING) {
          pipePausePlayback();
        }
      };
  
      PipeSDK.recorders[pipeElement].save = function () {
        if (pq.$("#pipeSaveVideo-" + pipeElement).hasClass("pipeBtn")) {
          pipeSaveVideo(2);
        }
      };
  
      PipeSDK.recorders[pipeElement].getStreamTime = function () {
        if (pq.$('#pipeError-' + pipeElement).length == 0) {
          return streamElapsedTime;
        }
      };
  
      PipeSDK.recorders[pipeElement].getPlaybackTime = function () {
        if (pq.$('#pipeError-' + pipeElement).length == 0) {
          return (playStreamElapsedTime / 1000).toFixed(2);;
        }
      };
  
      PipeSDK.recorders[pipeElement].getStreamName = function () {
        if (newFileName && pq.$('#pipeError-' + pipeElement).length == 0) {
          return newFileName;
        }
      };
  
      PipeSDK.recorders[pipeElement].remove = function () {
        if (localStream) {
          localStream.getTracks().forEach(function (track) {
            track.stop();
          });
          localStream = null;
        }
  
        if (socket) {
          socket.close();
        }
  
        for (var i = 0; i < intervals.length; i++) {
          clearInterval(intervals[i]);
        }
  
        pq.$("#" + pipeElement).html("").css("height", "0px");
  
        pipeRecorderRemoved = true;
  
        // Clear PipeQuery cache
        pq.clearCacheById(pipeElement);
      };
  
      PipeSDK.recorders[pipeElement].download = function () {
        // Only download if not recording or initial state AND download button is active
        state !== states.RECORDING && state !== states.INIT && pq.$("#pipeDownload-" + pipeElement).hasClass("pipeBtn") && pipeDownload();
      };
  
      /** Utils **/
  
      function stopMediaTracks(stream) {
        if (stream) {
          stream.getTracks().forEach(track => {
            track.stop();
          });
          stream = null;
        }
      }
  
      function generateName() {
        const validChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let array = new Uint8Array(32);
        window.crypto.getRandomValues(array);
        array = array.map(x => validChars.charCodeAt(x % validChars.length));
        const randomState = String.fromCharCode.apply(null, array);
        //console.log(randomState);
        return randomState;
      }
  
      function digits(nbr) {
        let min, sec, msec;
  
        if (statsForNerdsOpen) {
          // When statsForNerdsOpen is true, nbr is in milliseconds
          min = Math.floor(nbr / 60000);
          sec = Math.floor(nbr % 60000 / 1000);
          msec = Math.floor(nbr % 1000);
        } else {
          // When statsForNerdsOpen is false, nbr is in seconds
          min = Math.floor(nbr / 60);
          sec = Math.floor(nbr % 60);
          msec = 0; // Set milliseconds to 0
        }
  
        let str = zero(min) + ':' + zero(sec);
  
        // Only add ms if stats for nerds menu is open
        if (statsForNerdsOpen) {
          str += '.' + zero(msec, 3); // Display milliseconds with leading zeros
        }
  
        return str;
      }
  
      function zero(nbr) {
        if (nbr < 10) {
          return '0' + nbr;
        } else {
          return '' + nbr;
        }
      }
  
      function timeStamp() {
        return new Date().toISOString();
      }
  
      // Meter class that generates a number correlated to audio volume.
      // The meter class itself displays nothing, but it makes the
      // instantaneous and time-decaying volumes available for inspection.
      // It also reports on the fraction of samples that were at or near
      // the top of the measurement range.
      function SoundMeter(context) {
        this.context = context;
        this.instant = 0.0;
        this.slow = 0.0;
        this.clip = 0.0;
        this.script = context.createScriptProcessor(2048, 1, 1);
        var that = this;
        this.script.onaudioprocess = function (event) {
          var input = event.inputBuffer.getChannelData(0);
          var i;
          var sum = 0.0;
          var clipcount = 0;
          for (i = 0; i < input.length; ++i) {
            sum += input[i] * input[i];
            if (Math.abs(input[i]) > 0.99) {
              clipcount += 1;
            }
          }
          that.instant = Math.sqrt(sum / input.length);
          that.slow = 0.95 * that.slow + 0.05 * that.instant;
          that.clip = clipcount / input.length;
        };
      }
  
      SoundMeter.prototype.connectToSource = function (stream, callback) {
        console.log("pipe-log at " + timeStamp() + " SoundMeter connecting");
        try {
          this.mic = this.context.createMediaStreamSource(stream);
          this.mic.connect(this.script);
          // necessary to make sample run, but should not be.
          this.script.connect(this.context.destination);
          if (typeof callback !== 'undefined') {
            callback(null);
          }
        } catch (e) {
          console.error(e);
          if (typeof callback !== 'undefined') {
            callback(e);
          }
        }
      };
      SoundMeter.prototype.stop = function () {
        this.mic.disconnect();
        this.script.disconnect();
      };
    }
  };
  
  },{}]},{},[4]);
