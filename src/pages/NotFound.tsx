import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import Button from '../components/ui/Button';
import { useTheme } from '../contexts/ThemeContext'; // Import the theme context

const NotFound = () => {
  const { currentTheme } = useTheme(); // Get the current theme

  return (
    <div
      className={`flex min-h-screen flex-col items-center justify-center ${
        currentTheme === 'dark' ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'
      } px-4 py-16 sm:px-6 sm:py-24 md:grid md:place-items-center lg:px-8`}
    >
      <div className="mx-auto max-w-max">
        <main className="sm:flex">
          <p className="text-4xl font-extrabold text-primary-600 sm:text-5xl">404</p>
          <div className="sm:ml-6">
            <div
              className={`sm:border-l ${
                currentTheme === 'dark' ? 'sm:border-gray-700' : 'sm:border-gray-200'
              } sm:pl-6`}
            >
              <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
                Page not found
              </h1>
              <p
                className={`mt-4 text-base ${
                  currentTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                }`}
              >
                Sorry, we couldn't find the page you're looking for.
              </p>
            </div>
            <div className="mt-8 flex space-x-3 sm:border-l sm:border-transparent sm:pl-6">
              <Link to="/">
                <Button
                  icon={<ArrowLeft className="h-5 w-5" />}
                >
                  Go back home
                </Button>
              </Link>
              <Link to="/support">
                <Button variant="outline">
                  Contact support
                </Button>
              </Link>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default NotFound;