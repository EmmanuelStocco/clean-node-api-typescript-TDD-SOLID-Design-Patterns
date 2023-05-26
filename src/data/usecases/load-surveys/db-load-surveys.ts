import { type SurveyModel } from '../../../domain/models/survey'
import { type LoadSurveys } from '../../../domain/usecases/load-surveys'
import { type loadSurveysRepository } from '../../protocols/db/survey/load-survey-repository'

export class DbLoadSurveys implements LoadSurveys {
  constructor (private readonly loadSurveysRepository: loadSurveysRepository) {}
  async load (): Promise<SurveyModel[]> {
    await this.loadSurveysRepository.loadAll()
    return []
  }
}
