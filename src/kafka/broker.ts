import { Kafka } from 'kafkajs'

// 
require('dotenv').config()

const kafka = new Kafka({
    clientId: 'syncer',
    brokers: process.env.KAFKA_BROKERS?.split(',') ?? []
})

export default kafka
