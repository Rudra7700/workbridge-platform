import { NextResponse } from 'next/server'
import Razorpay from 'razorpay'

// Initialize lazily
const getRazorpay = () => {
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
        throw new Error("Razorpay keys not set")
    }
    return new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET,
    })
}

export async function POST(request: Request) {
    const { amount, currency = 'INR', receipt } = await request.json()

    try {
        const razorpay = getRazorpay()
        const order = await razorpay.orders.create({
            amount: amount * 100, // Razorpay expects amount in paise
            currency,
            receipt,
        })

        return NextResponse.json(order)
    } catch (error) {
        console.error('Error creating Razorpay order:', error)
        return NextResponse.json({ error: 'Error creating order' }, { status: 500 })
    }
}
