import { SignUpController } from './signup'
import { MissingParamError, InvalidParamError, ServerError } from '../../errors'
import { type EmailValidator, type AddAccount, type AddAccountModel, type AccountModel } from './signup-protocols'

const makeEmailValidator = (): EmailValidator => {
  class EmailValidatorStub implements EmailValidator {
    isValid (email: string): boolean {
      return true
    }
  }
  return new EmailValidatorStub()
}

const makeAddAccount = (): AddAccount => {
  class AddAccountStub implements AddAccount {
    async add (account: AddAccountModel): Promise<AccountModel> {
      const fakeAccount = {
        id: 'valid_id',
        name: 'valid_name',
        email: 'valid_email@mail.com',
        password: 'valid_password'
      }
      return new Promise(resolve => resolve(fakeAccount))
    }
  }
  return new AddAccountStub()
}

interface SutTypes {
  sut: SignUpController
  emailValidatorStub: EmailValidator
  addAccountStub: AddAccount
}

const makeSut = (): SutTypes => {
  const emailValidatorStub = makeEmailValidator()
  const addAccountStub = makeAddAccount()
  const sut = new SignUpController(emailValidatorStub, addAccountStub)
  return {
    sut,
    emailValidatorStub,
    addAccountStub
  }
}

describe('SignUp Controller', () => {
  test('Shoul return 400 if no name is provided', async () => {
    const { sut } = makeSut()
    const httpRequest = {
      body: {
        // name: 'any_name',
        email: 'any_emai@mail.com',
        password: 'any_password',
        passwordConfirmation: 'any_password'
      }
    }

    const httpReponse = await sut.handle(httpRequest)
    expect(httpReponse.statusCode).toBe(400)
    expect(httpReponse.body).toEqual(new MissingParamError('name'))
  })

  test('Shoul return 400 if no email is provided', async () => {
    const { sut } = makeSut()
    const httpRequest = {
      body: {
        name: 'any_name',
        // email: 'any_emai@mail.com',
        password: 'any_password',
        passwordConfirmation: 'any_password'
      }
    }

    const httpReponse = await sut.handle(httpRequest)
    expect(httpReponse.statusCode).toBe(400)
    expect(httpReponse.body).toEqual(new MissingParamError('email'))
  })

  test('Shoul return 400 if no password is provided', async () => {
    const { sut } = makeSut()
    const httpRequest = {
      body: {
        name: 'any_name',
        email: 'any_emai@mail.com',
        // password: 'any_password',
        passwordConfirmation: 'any_password'
      }
    }

    const httpReponse = await sut.handle(httpRequest)
    expect(httpReponse.statusCode).toBe(400)
    expect(httpReponse.body).toEqual(new MissingParamError('password'))
  })

  test('Shoul return 400 if no password confirmation is provided', async () => {
    const { sut } = makeSut()
    const httpRequest = {
      body: {
        name: 'any_name',
        email: 'any_emai@mail.com',
        password: 'any_password'
        // passwordConfirmation: 'any_password'
      }
    }

    const httpReponse = await sut.handle(httpRequest)
    expect(httpReponse.statusCode).toBe(400)
    expect(httpReponse.body).toEqual(new MissingParamError('passwordConfirmation'))
  })

  test('Shoul return 400 if no password confirmation fails', async () => {
    const { sut } = makeSut()
    const httpRequest = {
      body: {
        name: 'any_name',
        email: 'any_emai@mail.com',
        password: 'any_password',
        passwordConfirmation: 'invalid_password'
      }
    }

    const httpReponse = await sut.handle(httpRequest)
    expect(httpReponse.statusCode).toBe(400)
    expect(httpReponse.body).toEqual(new InvalidParamError('passwordConfirmation'))
  })

  test('Shoul return 400 if an invalid email is provided', async () => {
    const { sut, emailValidatorStub } = makeSut()
    jest.spyOn(emailValidatorStub, 'isValid').mockReturnValueOnce(false)
    const httpRequest = {
      body: {
        name: 'any_name',
        email: 'invalid_emai@mail.com',
        password: 'any_password',
        passwordConfirmation: 'any_password'
      }
    }

    const httpReponse = await sut.handle(httpRequest)
    expect(httpReponse.statusCode).toBe(400)
    expect(httpReponse.body).toEqual(new InvalidParamError('email'))
  })

  test('Shoul call EmailValidator with correct email', async () => {
    const { sut, emailValidatorStub } = makeSut()
    const isValidSpy = jest.spyOn(emailValidatorStub, 'isValid')

    const httpRequest = {
      body: {
        name: 'any_name',
        email: 'any_emai@mail.com',
        password: 'any_password',
        passwordConfirmation: 'any_password'
      }
    }

    await sut.handle(httpRequest)
    expect(isValidSpy).toHaveBeenCalledWith('any_emai@mail.com')
  })

  test('Shoul return 500 if EmailValidator throws', async () => {
    const { sut, emailValidatorStub } = makeSut()
    jest.spyOn(emailValidatorStub, 'isValid').mockImplementationOnce(() => {
      throw new Error()
    })

    const httpRequest = {
      body: {
        name: 'any_name',
        email: 'any_emai@mail.com',
        password: 'any_password',
        passwordConfirmation: 'any_password'
      }
    }

    const httpReponse = await sut.handle(httpRequest)
    expect(httpReponse.statusCode).toBe(500)
    expect(httpReponse.body).toEqual(new ServerError())
  })

  test('Shoul return 500 if addAccount throws', async () => {
    const { sut, addAccountStub } = makeSut()
    jest.spyOn(addAccountStub, 'add').mockImplementationOnce(async () => {
      return new Promise((resolve, reject) => reject(new Error()))
    })

    const httpRequest = {
      body: {
        name: 'any_name',
        email: 'any_emai@mail.com',
        password: 'any_password',
        passwordConfirmation: 'any_password'
      }
    }

    const httpReponse = await sut.handle(httpRequest)
    expect(httpReponse.statusCode).toBe(500)
    expect(httpReponse.body).toEqual(new ServerError())
  })

  test('Shoul call AddAcount with correct values', async () => {
    const { sut, addAccountStub } = makeSut()
    const addSpy = jest.spyOn(addAccountStub, 'add')
    const httpRequest = {
      body: {
        name: 'any_name',
        email: 'any_emai@mail.com',
        password: 'any_password',
        passwordConfirmation: 'any_password'
      }
    }

    await sut.handle(httpRequest)
    expect(addSpy).toHaveBeenCalledWith({
      name: 'any_name',
      email: 'any_emai@mail.com',
      password: 'any_password'
    })
  })

  test('Shoul return 200 if valid data is provided', async () => {
    const { sut } = makeSut()

    const httpRequest = {
      body: {
        name: 'valid_name',
        email: 'valid_emai@mail.com',
        password: 'valid_password',
        passwordConfirmation: 'valid_password'
      }
    }

    const httpReponse = await sut.handle(httpRequest)
    expect(httpReponse.statusCode).toBe(200)
    expect(httpReponse.body).toEqual({
      id: 'valid_id',
      name: 'valid_name',
      email: 'valid_email@mail.com',
      password: 'valid_password'
    })
  })
})