import React, { useContext, useRef, useEffect, useState } from 'react';
import { MediaContext } from '../MediaContext';
import Button from '@mui/material/Button';
import vader from '../../assets/vader.jpg';
import naruto from '../../assets/naruto.jpg';
import styled from 'styled-components';
import { BsCameraFill, BsCameraReelsFill, BsDownload } from 'react-icons/bs';
import { MdOutlineAvTimer, MdDelete } from 'react-icons/md';

function Camera() {
   const API_KEY = process.env.REACT_APP_API_KEY;
   const API_URL = `https://api.opencagedata.com/geocode/v1/json?key=${API_KEY}`;

   const videoRef = useRef(null);
   const imgRef = useRef();
   const [canUseMd, setCanUseMd] = useState(false);
   const [camerIsOn, setCameraIsOn] = useState(false);
   const { videoStream, setVideoStream } = useContext(MediaContext);
   const [images, setImages] = useState([{ url: vader }, { url: naruto }]);
   const [time, setTime] = useState();
   const [canUseGeo, setCanUseGeo] = useState(false);
   const [staticImg, setStaticImg] = useState([vader, naruto][0]);

   // const [locationMessage, setLocationMessage] = useState([]);
   // const [currPosition, setCurrPosition] = useState(null);

   // async function onSuccsess(pos) {
   //    console.log('current position is:', pos);
   //    const adress = await lookupPosition(pos.coords.latitude, pos.coords.longitude);
   //    if (adress) {
   //       console.log(adress);
   //       console.log(time);
   //    }
   // }

   // async function lookupPosition(lat, lon) {
   //    try {
   //       const response = await fetch(
   //          `https://geocode.xyz/${lat},${lon}?geoit=json`
   //       );
   //       const data = await response.json();
   //       if (data.error) {
   //          console.log('Could not get position');
   //          return null;
   //       }
   //       console.log(data);
   //       return data;
   //    } catch (error) {
   //       console.log('No position');
   //       return null;
   //    }
   // }

   // useEffect(() => {
   //    onSuccsess();
   // }, []);

   async function getGeoData(lat, long) {
      try {
         const res = await fetch(`${API_URL}&q=${lat}+${long}`);
         const data = await res.json();
         const geoData = data.results[0].components;

         if (!res.ok) {
            throw new Error('Failed to fetch geo-data');
         }

         return geoData;
      } catch (error) {
         console.log(error);
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
      console.log(1);
      await photo.toBlob(
         (blob) => {
            console.log(2);
            navigator.geolocation.getCurrentPosition(
               async (pos) => {
                  console.log(3, pos);

                  const { country, city, road } = await getGeoData(
                     pos.coords.latitude,
                     pos.coords.longitude
                  );
                  console.log(4);

                  const localTime = new Date(pos.timestamp).toLocaleTimeString();
                  setTime(localTime);

                  console.log(country, city, road);
                  const picture = {
                     alt: 'Photo from camera',
                     url: URL.createObjectURL(blob),
                     location: { country, city, road },
                     time: localTime,
                  };

                  setImages([...images, picture]);
               },
               (error) => {
                  console.log(error.message);
                  const picture = {
                     alt: 'Photo from camera',
                     url: URL.createObjectURL(blob),
                     location: {
                        country: 'Unknown',
                        city: 'Unknown',
                        road: 'Unkown',
                     },
                     time: 'Cannot get time',
                  };

                  setImages([...images, picture]);
               }
            );
         },
         'images/jpeg',
         1
      );
   }

   useEffect(() => {
      if ('geolocation' in navigator) {
         setCanUseGeo(true);
      } else {
         setCanUseGeo(false);
      }
   }, []);

   useEffect(() => {
      setCanUseMd('mediaDevices' in navigator);
   }, []);

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
            {images.map((obj, i) => (
               <div className="imgContainer" key={i}>
                  {
                     <img
                        key={i}
                        src={obj.url}
                        alt="booth"
                        onClick={() => setStaticImg(obj.url)}
                     />
                  }
                  <Button
                     variant="Primary"
                     className="delete-btn"
                     onClick={() => removeImg(i)}
                  >
                     <MdDelete className="delete-icon" />
                  </Button>
                  <a download className="download-btn" href={obj.url}>
                     Download <BsDownload />
                  </a>
                  {canUseGeo ? (
                     <div>
                        <p> {obj?.location?.country} </p>
                        <p> {obj?.location?.city} </p>
                        <p> {obj?.location?.road}</p>
                        <p>{time && obj.time}</p>
                     </div>
                  ) : (
                     'location unknown'
                  )}
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
