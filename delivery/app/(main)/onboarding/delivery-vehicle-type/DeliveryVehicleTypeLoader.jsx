'use client';
// PATH: driver/app/(main)/onboarding/delivery-vehicle-type/DeliveryVehicleTypeLoader.jsx
import dynamic from 'next/dynamic';

const DeliveryVehicleTypePage = dynamic(
  () => import('./DeliveryVehicleTypePage'),
  { ssr: false, loading: () => null }
);

export default function DeliveryVehicleTypeLoader() {
  return <DeliveryVehicleTypePage />;
}