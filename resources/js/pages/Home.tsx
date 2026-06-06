import React from 'react';
import { Head } from '@inertiajs/react';

export default function Home() {
  return (
    <>
      <Head title="Home" />
      <div className="p-8">
        <h1 className="text-3xl font-bold">Welcome to the CMS</h1>
        <p className="mt-4 text-gray-600">This is the main landing page built with TypeScript and Inertia.</p>
      </div>
    </>
  );
}
