import React, { createContext, useState } from 'react';

export const MediaContext = createContext();

function MediaContextProvider({ children }) {
   const [videoStream, setVideoStream] = useState();

   const values = {
      videoStream: videoStream,
      setVideoStream: setVideoStream,
   };
   return <MediaContext.Provider value={values}>{children}</MediaContext.Provider>;
}

export default MediaContextProvider;
