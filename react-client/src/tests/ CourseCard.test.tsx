import{ describe, it, expect } from "vitest";
import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react"
import { CourseCard } from "@/components/CourseCard";

const mockCourse = { 
    id: "1",
    code: "CS 202",
    title: "Introduction to Computer Science II",
    instructor: "Sarah Davis",
    schedule: "MW 1:00 PM - 2:15 PM",
    credits: 3,
    enrolled: 50,
    capacity: 100,
    location: "WPEB 130",
    department: "CS",
    component: "LEC",
    section: 1001,
    level: "200",
    courseCareer: "Undergraduate",
    modeOfInstruction: "In Person",
};

describe("CourseCard", () => {
    it("displays course data correctly", () => {        
        render(<CourseCard {...mockCourse}/>);
        expect(screen.getByText("CS 202")).toBeInTheDocument();
        expect(screen.getByText("Introduction to Computer Science II")).toBeInTheDocument();
        expect(screen.getByText("Sarah Davis")).toBeInTheDocument();
        expect(screen.getByText("MW 1:00 PM - 2:15 PM")).toBeInTheDocument();
        expect(screen.getByText("WPEB 130")).toBeInTheDocument();
        expect(screen.getByText("LEC")).toBeInTheDocument();
        expect(screen.getByText("Undergraduate")).toBeInTheDocument();
        expect(screen.getByText("In Person")).toBeInTheDocument();
    });
})