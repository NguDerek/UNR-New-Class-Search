import { useState } from 'react'
import { z } from 'zod'

//https://zod.dev/
//will be used for form validation later
//Interface can be used here but Zod seems better for form validation?
const accountCreationSchema = z.object({
  email: z.email(),
  password: z.string()
})

export default function AccountCreation() {
    return (
        <div>
            <div className="accountCreation">
                <h1>Account Creation!</h1>
                <div className="email">
                </div>
            </div>
        </div>
    );
}