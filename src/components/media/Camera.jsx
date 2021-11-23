import React, { useContext, useRef, useEffect, useState } from 'react';
import { MediaContext } from '../MediaContext';
import Button from '@mui/material/Button';
import vader from '../../assets/vader.jpg';
import naruto from '../../assets/naruto.jpg';
import styled from 'styled-components';
import { BsCameraFill, BsCameraReelsFill, BsDownload } from 'react-icons/bs';
import { MdOutlineAvTimer, MdDelete } from 'react-icons/md';

function Camera() {
   const videoRef = useRef(null);
   const imgRef = useRef();
   const [canUseMd, setCanUseMd] = useState(false);
   const [camerIsOn, setCameraIsOn] = useState(false);
   const { videoStream, setVideoStream } = useContext(MediaContext);
   const [images, setImages] = useState([vader, naruto]);
   const [time, setTime] = useState(null);
   const [canUseGeo, setCanUseGeo] = useState(false);
   const [staticImg, setStaticImg] = useState([vader, naruto][0]);
   const [locationMessage, setLocationMessage] = useState([]);

   useEffect(() => {
      setCanUseMd('mediaDevices' in navigator);
      setCanUseGeo('geolocation' in navigator);
   }, []);

   async function onSuccsess(pos) {
      console.log('current position is:', pos);
      const adress = await lookupPosition(pos.coords.latitude, pos.coords.longitude);
      if (adress) {
         console.log(adress);
         setLocationMessage(adress);
         setTime(new Date().toLocaleString());
         console.log(time);
      }
   }

   async function lookupPosition(lat, lon) {
      try {
         const response = await fetch(
            `https://geocode.xyz/${lat},${lon}?geoit=json`
         );
         const data = await response.json();
         if (data.error) {
            console.log('Could not get position');
            return null;
         }
         console.log(data);
         return data;
      } catch (error) {
         console.log('No position');
         return null;
      }
   }

   async function takePicture() {
      const width = 414;
      const height = width / (16 / 9);

      let video = videoRef.current;
      let photo = imgRef.current;

      photo.width = width;
      photo.height = height;

      photo.getContext('2d').drawImage(video, 0, 0, width, height);
      await photo.toBlob(
         (blob) => setImages([...images, URL.createObjectURL(blob)]),
         'image/jpeg',
         1
      );
      if (navigator.geolocation.getCurrentPosition(onSuccsess)) {
         takePicture();
      } else {
         console.log('No location');
         setLocationMessage('Unknown location');
         console.log(locationMessage);
      }
   }

   const removeImg = (index) => {
      const newList = (images) => images.filter((_, i) => i !== index);
      setImages(newList);
   };

   function turnOffCamera() {
      let tracks = videoStream.getTracks();
      tracks.forEach((track) => track.stop());
      setVideoStream(null);
   }

   async function toggleCameraBtn() {
      if (camerIsOn) {
         console.log('No');
         turnOffCamera();
         setCameraIsOn(false);
      } else {
         startCamera(videoRef.current, setCameraIsOn(true));
      }
   }

   // const downloadHandler = async (img) => {
   //    const originalImage = img;

   //    const image = await fetch(originalImage);

   //    const nameSplit = originalImage.split('/');
   //    const duplicateName = nameSplit.pop();

   //    const imageBlog = await image.blob();
   //    const imageURL = URL.createObjectURL(imageBlog);

   //    const link = document.createElement('a');
   //    link.href = imageURL;
   //    link.download = '' + duplicateName + '';
   //    link.click();
   // };

   function timerHandler() {
      let counter = 3;
      const counterInterval = setInterval(() => {
         if (counter === 0) {
            takePicture();
            clearInterval(counterInterval);
         }

         counter--;
         console.log(counter);
      }, 300);
   }

   async function startCamera(videoElement) {
      const constraints = {
         video: { facingMode: 'user', width: 500, height: 500 },
         audio: false,
      };

      try {
         const stream = await navigator.mediaDevices.getUserMedia(constraints);
         setVideoStream(stream);
         videoElement.srcObject = stream;
         videoElement.addEventListener('loadedmetadata', () => {
            videoElement.play();
         });
      } catch (error) {
         console.log('Something went wrong', error.message);
      }
   }

   return (
      <PicWrapper>
         {canUseMd ? <video className="video-window" ref={videoRef}></video> : null}
         <div className="main-container">
            <Button
               style={{ backgroundColor: 'yellow' }}
               variant="Primary"
               onClick={toggleCameraBtn}
            >
               <BsCameraReelsFill />
               {camerIsOn ? 'Stop Camera' : 'Start Camera'}
            </Button>
            <Button
               style={{ backgroundColor: 'green' }}
               variant="Primary"
               onClick={videoStream ? takePicture : null}
            >
               <BsCameraFill />
            </Button>
            <Button
               style={{ backgroundColor: 'red' }}
               variant="Primary"
               onClick={timerHandler}
            >
               <MdOutlineAvTimer />
            </Button>
         </div>
         <canvas hidden={true} ref={imgRef}></canvas>
         <img src={staticImg} alt="" className="selected" />
         <div className="container">
            {images.map((pic, i) => (
               <div className="imgContainer" key={i}>
                  <img
                     key={i}
                     style={{ border: pic === images ? '4px solid purple' : '' }}
                     src={pic}
                     alt="booth"
                     onClick={() => setStaticImg(pic)}
                  />
                  <Button
                     variant="Primary"
                     className="delete-btn"
                     onClick={() => removeImg(i)}
                  >
                     <MdDelete className="delete-icon" />
                  </Button>
                  <a
                     download
                     className="download-btn"
                     href={pic}
                     // variant="Primary"
                     // onClick={() => downloadHandler(pic)}
                  >
                     Download <BsDownload />
                  </a>
                  {
                     <div>
                        <p>{locationMessage.country}</p>
                        <p>{locationMessage.city}</p>
                        <p>{time}</p>
                     </div>
                  }
               </div>
            ))}
         </div>
      </PicWrapper>
   );
}

const PicWrapper = styled.div`
   * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
   }

   a {
      text-decoration: none;
      color: black;
   }

   .video-window {
      background: #1b1a1b2b;
      width: 39em;
      height: 37.4em;
      border: 3px solid purple;
   }

   img {
      display: block;
      cursor: pointer;
   }

   .container {
      margin: auto;
      width: 100%;
      max-width: 540px;
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
   }

   .selected {
      width: 400px;
      height: 400px;
      margin: 0 auto;
      border: 4px solid palevioletred;
   }
   .imgContainer {
      width: 100%;
      display: grid;
      justify-content: center;

      flex-wrap: wrap;
      padding: 40px 0 0 0;
   }

   .container .imgContainer img {
      width: 100px;
      height: 100px;
      margin: 5px 0;
   }
   .imgContainer .delete-btn {
      background-color: #beaaee;
      height: 2em;
      width: 3em;
   }
   .delete-icon {
      height: 25px;
      width: 25px;
   }

   .imgContainer .download-btn {
      background-color: peru;
   }
`;

export default Camera;
