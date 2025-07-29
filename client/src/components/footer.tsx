import byootifyLogoWhite from "@assets/byootify-logo-white_1753513480403.png";

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-1">
            <img 
              src={byootifyLogoWhite} 
              alt="Byootify - Simplify the Beauty Process" 
              className="h-16 mb-4"
            />
            <p className="text-gray-400 mb-4">Connecting beauty professionals with clients for seamless booking experiences.</p>
          </div>
          
          <div>
            <h5 className="text-lg font-semibold mb-4">For Clients</h5>
            <ul className="space-y-2 text-gray-400">
              <li><a href="#" className="hover:text-white transition-colors">Find Professionals</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Book Services</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Safety Guidelines</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
            </ul>
          </div>
          
          <div>
            <h5 className="text-lg font-semibold mb-4">For Professionals</h5>
            <ul className="space-y-2 text-gray-400">
              <li><a href="#" className="hover:text-white transition-colors">Join as Professional</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Business Tools</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Success Stories</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Resources</a></li>
            </ul>
          </div>
          
          <div>
            <h5 className="text-lg font-semibold mb-4">Support</h5>
            <ul className="space-y-2 text-gray-400">
              <li><a href="#" className="hover:text-white transition-colors">Contact Us</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
              <li><a href="#" className="hover:text-white transition-colors">About Us</a></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
          <p>&copy; 2025 Byootify. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}