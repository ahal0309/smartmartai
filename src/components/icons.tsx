import type { LucideProps } from "lucide-react";
import { Sparkles, ShoppingCart, LineChart, Truck, Package } from 'lucide-react';

export const Icons = {
    sparkles: (props: LucideProps) => <Sparkles {...props} />,
    shoppingCart: (props: LucideProps) => <ShoppingCart {...props} />,
    lineChart: (props: LucideProps) => <LineChart {...props} />,
    truck: (props: LucideProps) => <Truck {...props} />,
    package: (props: LucideProps) => <Package {...props} />,
    logo: (props: LucideProps) => (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        {...props}
      >
        <path d="M6 20V11a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v9" />
        <path d="M6 20h12" />
        <path d="M12 4V9" />
        <path d="m8 6 4-4 4 4" />
      </svg>
    ),
    google: (props: LucideProps) => (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="48px" height="48px" {...props}>
            <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/>
            <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/>
            <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.222,0-9.519-3.355-11.024-7.944l-6.573,5.163C9.25,39.583,16.02,44,24,44z"/>
            <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.574l6.19,5.238C39.986,36.56,44,30.738,44,24C44,22.659,43.862,21.35,43.611,20.083z"/>
        </svg>
    ),
    facebook: (props: LucideProps) => (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="48px" height="48px" {...props}>
            <path fill="#039be5" d="M24 5A19 19 0 1 0 24 43A19 19 0 1 0 24 5Z"/>
            <path fill="#fff" d="M26.572,29.036h4.917l0.772-4.995h-5.69v-2.73c0-2.075,0.678-3.915,2.619-3.915h3.119v-4.359c-0.548-0.074-1.707-0.236-3.899-0.236c-4.573,0-7.254,2.415-7.254,7.917v3.323h-4.701v4.995h4.701v13.729C22.089,42.905,23.032,43,24,43c0.875,0,1.729-0.08,2.572-0.194V29.036z"/>
        </svg>
    ),
};
