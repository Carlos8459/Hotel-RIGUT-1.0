import React from 'react';
import { Utensils, GlassWater, Droplet, Droplets, Beer, Coffee, Sandwich, CakeSlice, IceCream, Package } from 'lucide-react';

export const availableIcons: { [key: string]: React.ReactNode } = {
    Utensils: <Utensils className="h-5 w-5" />,
    GlassWater: <GlassWater className="h-5 w-5" />,
    Droplet: <Droplet className="h-5 w-5" />,
    Droplets: <Droplets className="h-5 w-5" />,
    Beer: <Beer className="h-5 w-5" />,
    Coffee: <Coffee className="h-5 w-5" />,
    Sandwich: <Sandwich className="h-5 w-5" />,
    CakeSlice: <CakeSlice className="h-5 w-5" />,
    IceCream: <IceCream className="h-5 w-5" />,
    Package: <Package className="h-5 w-5" />,
};

export type IconName = keyof typeof availableIcons;
