import { Search, SlidersHorizontal, BookmarkPlus } from "lucide-react";
import { Button } from "./ui/Button";

interface HomeProps {
  onGetStarted: () => void;
}

export function Home({ onGetStarted }: HomeProps) {
  const steps = [
    {
      number: 1,
      title: "Search for a Class",
      description: "Browse courses by subject, number, or keyword",
      icon: Search,
    },
    {
      number: 2,
      title: "Filter Results",
      description: "Narrow down options by term, credits, or days",
      icon: SlidersHorizontal,
    },
    {
      number: 3,
      title: "Save or Plan",
      description: "Keep track of classes that fit your schedule",
      icon: BookmarkPlus,
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 lg:py-12">
      {/* Page Title Section */}
      <div className="mb-12 lg:mb-16">
        <h1 className="text-[#003366] mb-2">University of Nevada, Reno</h1>
        <p className="text-slate-600">Class Search</p>
      </div>

      {/* Three-Step Layout */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        {steps.map((step) => {
          const Icon = step.icon;
          return (
            <div
              key={step.number}
              className="bg-white rounded-xl border border-slate-200 p-8 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-[#003366] rounded-full flex items-center justify-center mb-4">
                  <Icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-[#003366] mb-2">
                  Step {step.number}: {step.title}
                </h3>
                <p className="text-slate-600 text-sm">{step.description}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Get Started Button */}
      <div className="flex justify-center">
        <Button
          onClick={onGetStarted}
          className="bg-[#003366] hover:bg-[#002244] text-white px-8 py-6"
        >
          Get Started
        </Button>
      </div>
    </div>
  );
}
