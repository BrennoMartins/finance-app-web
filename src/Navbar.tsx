import React from "react";
import { NavigationMenu, NavigationMenuList, NavigationMenuItem, NavigationMenuLink } from "@/components/ui/navigation-menu";

export default function Navbar() {
  return (
    <div className="border-b bg-white shadow-sm">
      <div className="container mx-auto px-4">
        <NavigationMenu>
          <NavigationMenuList className="flex space-x-6 py-4">
            <NavigationMenuItem>
              <NavigationMenuLink className="text-gray-700 hover:text-blue-600 font-medium" href="/">
                Home
              </NavigationMenuLink>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuLink className="text-gray-700 hover:text-blue-600 font-medium" href="/ativos">
                Ativos
              </NavigationMenuLink>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuLink className="text-gray-700 hover:text-blue-600 font-medium" href="/sobre">
                Sobre
              </NavigationMenuLink>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      </div>
    </div>
  );
}
