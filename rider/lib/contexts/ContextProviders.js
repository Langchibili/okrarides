// 'use client';

// import React from 'react';
// import ReactNativeWrapper from './ReactNativeWrapper';
// import { ThemeProvider } from '@/components/ThemeProvider';
// import { AdminSettingsProvider } from '../hooks/useAdminSettings';
// import { AuthProvider } from '../hooks/useAuth';
// import { ScreenshotProvider } from './ScreenshotContext';
// import SocketProvider from '../socket/SocketProvider';
// import { MapsProvider } from '@/components/APIProviders';
// import { FloatingCaptureButton } from '@/components/FloatingCaptureButton';


// export default function ContextProviders({ children }) {
//   return (
//     <ReactNativeWrapper>
//       <ThemeProvider>
//         <AdminSettingsProvider>
//           <AuthProvider>
//             <ScreenshotProvider>
//               <SocketProvider>
//                 <MapsProvider>
//                   {children}
//                 </MapsProvider>
//                 {/* Positioned inside Socket/Screenshot context if it needs them */}
//                 <FloatingCaptureButton/>
//               </SocketProvider>
//             </ScreenshotProvider>
//           </AuthProvider>
//         </AdminSettingsProvider>
//       </ThemeProvider>
//     </ReactNativeWrapper>
//   );
// }
'use client';
// PATH: lib/contexts/ContextProviders.jsx

import React from 'react';
import ReactNativeWrapper        from './ReactNativeWrapper';
import { ThemeProvider }         from '@/components/ThemeProvider';
import { AdminSettingsProvider } from '../hooks/useAdminSettings';
import { AuthProvider }          from '../hooks/useAuth';
import { ScreenshotProvider }    from './ScreenshotContext';
import SocketProvider            from '../socket/SocketProvider';
import { MapsProvider }          from '@/components/APIProviders';
import { FloatingCaptureButton } from '@/components/FloatingCaptureButton';
import { BottomNavProvider }     from './BottomNavContext';

export default function ContextProviders({ children }) {
  return (
    <ReactNativeWrapper>
      <ThemeProvider>
        <AdminSettingsProvider>
          <AuthProvider>
            <ScreenshotProvider>
              <SocketProvider>
                {/* <MapsProvider> */}
                  {/* BottomNavProvider sits inside MapsProvider so booking
                      pages that need map + nav control have access to both */}
                  <BottomNavProvider>
                    {children}
                  </BottomNavProvider>
                {/* </MapsProvider> */}
                <FloatingCaptureButton />
              </SocketProvider>
            </ScreenshotProvider>
          </AuthProvider>
        </AdminSettingsProvider>
      </ThemeProvider>
    </ReactNativeWrapper>
  );
}