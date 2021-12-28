import { ApolloServer, UserInputError, gql } from "apollo-server"
import { v1 as uuid } from "uuid"
import axios from "axios"

const persons = [{
        id: uuid(),
        name: "Clementine Bauch",
        street: "Kulas Light",
        city: "Gwenborough",
        phone: "1-770-736-8031 x56442",
        age: (Math.random()*99)+1,
    },
    {
        id: uuid(),
        name: "Leanne Graham",
        street: "Victor Plains",
        city: "Wisokyburgh",
        age: (Math.random()*99)+1,
    },
    {
        id: uuid(),
        name: "Ervin Howell",
        phone: "010-692-6593 x09125",
        street: "Douglas Extension",
        city: "McKenziehaven",
        age: (Math.random()*99)+1,
    },
]

const typeDefinitions = gql`
enum YesNo {
    YES
    NO
}

type Address {
    city: String!
    street: String!
}

type Person {
    name: String!
    age: Int,
    phone: String
    address: Address!,
    canDrink: Boolean,
    id: ID!
}

type Query {
    personCount: Int!
    allPersons: [Person]!
    allPersonsByPhone(phone:YesNo) : [Person]
    findPerson(name:String!): Person
}

type Mutation {
    addPerson(
        name: String!,
        phone: String, 
        age: Int, 
        street: String, 
        city: String
    ): Person
    editNumber(
        name:String!
        phone:String
    ): Person
    removePerson(
        name:String!
    ): Person
}
`

const resolvers = {
    Query: {
        personCount: () => persons.length,
        allPersons: () => persons,
        allPersonsByPhone: async (root,args) => {
        const {data:personsFromApi} = await axios.get("https://jsonplaceholder.typicode.com/users");
        if(!args.phone) return personsFromApi
            const byPhone = person => args.phone === "YES" ? person.phone : !person.phone
            return personsFromApi.filter(byPhone);
        },
        findPerson: (root, args) => {
            const {name} = args;
            return persons.find(person => person.name === name)
        }
    },
    Mutation: {
        addPerson: (root, args) => {
            if(persons.find(p => p.name === args.name)) {
                throw new UserInputError("Name must be unique",{
                    invalidArgs: args.name
                });
            }
            const person = {... args, id:uuid()}
            persons.push(person);
            return persons;
        },
        editNumber: (root, args) => {
           const personIndex = persons.findIndex(p => p.name === args.name)
            if(!personIndex === - 1) return null   
            const person = persons[personIndex];
            const updatedPerson = {... person, phone:args.phone};
            persons[personIndex] = updatedPerson;
            return person;
        },
        removePerson: (root, args) => {
            const personIndex = persons.findIndex(p => p.name === args.name)
             if(!personIndex === - 1) return null   
             persons.splice(personIndex,1);
             return persons;
         },
    },
    Person: {
        address: (root) => {
            return{
                street: root.street,
                city: root.city
            }
        },
        canDrink: (root) => root.age > 18
    }
}

const server = new ApolloServer({
    typeDefs: typeDefinitions,
    resolvers
})

server.listen().then(({ url }) => {
    console.log(`Server ready at ${url}`)
})