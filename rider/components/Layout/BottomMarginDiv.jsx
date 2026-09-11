// components/Layout/BottomMarginDiv.jsx
'use client';

export const BottomMarginDiv = ({mb}) => {
 if(!mb) return null   
 return <div style={{minHeight:mb}}></div>
}