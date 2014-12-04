package eu.factorx.citizens.controllers;

import eu.factorx.citizens.controllers.technical.SecuredController;
import eu.factorx.citizens.converter.AccountToAccountDTOConverter;
import eu.factorx.citizens.converter.SurveyToSurveyDTOConverter;
import eu.factorx.citizens.dto.*;
import eu.factorx.citizens.model.account.Account;
import eu.factorx.citizens.model.survey.Survey;
import eu.factorx.citizens.model.survey.TopicEnum;
import eu.factorx.citizens.service.AccountService;
import eu.factorx.citizens.service.SurveyService;
import eu.factorx.citizens.service.impl.AccountServiceImpl;
import eu.factorx.citizens.service.impl.SurveyServiceImpl;
import eu.factorx.citizens.util.BusinessErrorType;
import eu.factorx.citizens.util.email.EmailEnum;
import eu.factorx.citizens.util.email.EmailParams;
import eu.factorx.citizens.util.exception.MyRuntimeException;
import eu.factorx.citizens.util.security.KeyGenerator;
import eu.factorx.citizens.util.security.LoginAttemptManager;
import org.apache.commons.lang3.StringUtils;
import play.Logger;
import play.db.ebean.Transactional;
import play.mvc.Result;
import play.mvc.Security;

import java.util.HashMap;
import java.util.List;

/**
 * Created by florian on 20/11/14.
 */
public class AccountController extends AbstractController {

    //service
    private AccountService accountService = new AccountServiceImpl();
    private SurveyService surveyService = new SurveyServiceImpl();
    //converter
    private AccountToAccountDTOConverter accountToAccountDTOConverter = new AccountToAccountDTOConverter();
    private SurveyToSurveyDTOConverter surveyToSurveyDTOConverter = new SurveyToSurveyDTOConverter();
    //controller
    private SurveyController surveyController = new SurveyController();
    private SecuredController securedController = new SecuredController();
    private EmailController emailController = new EmailController();

    @Transactional
    @Security.Authenticated(SecuredController.class)
    public Result changeEmail() {

        ChangeEmailDTO dto = extractDTOFromRequest(ChangeEmailDTO.class);

        Account account = securedController.getCurrentUser();

        //control password
        if (accountService.controlPassword(dto.getOldPassword(), account) == false) {
            throw new MyRuntimeException(BusinessErrorType.WRONG_OLD_PASSWORD);
        }

        //add password
        account.setEmail(dto.getEmail());

        //save
        accountService.saveOrUpdate(account);

        //update context
        securedController.storeIdentifier(account);

        //return
        return ok(new ResultDTO());
    }

    @Transactional
    @Security.Authenticated(SecuredController.class)
    public Result changePassword() {

        ChangePasswordDTO dto = extractDTOFromRequest(ChangePasswordDTO.class);

        Account account = securedController.getCurrentUser();

        //control password
        if (accountService.controlPassword(dto.getOldPassword(), account) == false) {
            throw new MyRuntimeException(BusinessErrorType.WRONG_OLD_PASSWORD);
        }

        //add password
        account.setPassword(dto.getNewPassword());

        //save
        accountService.saveOrUpdate(account);

        //return
        return ok(new ResultDTO());
    }


    /**
     * return survey if the user is connected
     *
     * @return
     */
    @Transactional
    @Security.Authenticated(SecuredController.class)
    public Result testAuthentication() {

        Logger.error("current user : "+securedController.getCurrentUser());

        Survey survey = surveyService.findValidSurveyByAccount(securedController.getCurrentUser());

        if (survey == null) {
            throw new MyRuntimeException("there is no not deleted survey for account " + securedController.getCurrentUser().getId());
        }

        //build dto
        return ok(surveyToSurveyDTOConverter.convert(survey));
    }

    @Transactional
    public Result login() {
        return login(false);
    }

    @Transactional
    public Result loginSuperAdmin(){
        return login(true);
    }

    private Result login(boolean onlyForSuperAdmin) {
        LoginDTO loginDTO = extractDTOFromRequest(LoginDTO.class);

        //test attempts
        if (LoginAttemptManager.tooManyAttempts(loginDTO.getEmail(), getIpAddress())) {
            throw new MyRuntimeException(BusinessErrorType.TOO_MANY_ATTEMPT);
        }

        //login
        Account account = accountService.findByEmail(loginDTO.getEmail());

        if (account == null || !accountService.controlPassword(loginDTO.getPassword(), account)) {
            LoginAttemptManager.failedAttemptLogin(loginDTO.getEmail(), getIpAddress());
            throw new MyRuntimeException(BusinessErrorType.WRONG_CREDENTIALS);
        }

        //test superAdmin
        if(onlyForSuperAdmin && !account.isSuperAdmin()){
            throw new MyRuntimeException(BusinessErrorType.WRONG_RIGHT);
        }

        //build and return result
        Survey survey = surveyService.findValidSurveyByAccount(account);

        if (survey == null) {
            throw new MyRuntimeException("there is no not deleted survey for account " + account.getId());
        }

        //save account into context
        securedController.storeIdentifier(account);

        //build dto
        return ok(surveyToSurveyDTOConverter.convert(survey));
    }


    @Transactional
    @Security.Authenticated(SecuredController.class)
    public Result logout() {
        session().clear();
        return ok(new ResultDTO());
    }

    @Transactional
    public Result forgotPassword() {

        ForgotPasswordDTO dto = extractDTOFromRequest(ForgotPasswordDTO.class);


        //load account by email
        Account account = accountService.findByEmail(dto.getEmail());

        if (account == null) {
            throw new MyRuntimeException(BusinessErrorType.EMAIL_DOESNT_EXIT);
        }

        //change password
        String password = KeyGenerator.generateRandomPassword(12);

        account.setPassword(password);

        //send email
        //create listParam
        HashMap<EmailParams, String> paramsMap = new HashMap<>();
        for (EmailParams emailParams : EmailEnum.FORGOT_PASSWORD.getExpectedParams()) {
            if (emailParams.getName().equals("firstName")) {
                paramsMap.put(emailParams, account.getFirstName());
            } else if (emailParams.getName().equals("lastName")) {
                paramsMap.put(emailParams, account.getLastName());
            } else if (emailParams.getName().equals("newPassword")) {
                paramsMap.put(emailParams, password);
            }
        }

        emailController.sendEmail(account.getEmail(), EmailEnum.FORGOT_PASSWORD, paramsMap);

        return ok(new ResultDTO());
    }

    @Transactional
    public Result createAccountAndSaveData() {

        SurveyDTO dto = extractDTOFromRequest(SurveyDTO.class);

        if (dto.getAccount().getId() != null) {
            return updateAccountAndSaveData();
        }

        //test if the account is already create
        Account account = null;

        //create new account
        //control email
        account = accountService.findByEmail(dto.getAccount().getEmail());

        if (account != null) {
            throw new MyRuntimeException(BusinessErrorType.EMAIL_ALREADY_USED, account.getEmail());
        }

        account = new Account();

        //build account
        account.setPassword(dto.getAccount().getPassword());
        account.setEmail(dto.getAccount().getEmail());
        account.setFirstName(dto.getAccount().getFirstName());
        account.setLastName(dto.getAccount().getLastName());
        account.setZipCode(dto.getAccount().getZipCode());
        account.setAccountType(getAccountTypeByString(dto.getAccount().getAccountType()));
        account.setOtherEmailAdresses(StringUtils.join(dto.getAccount().getOtherEmailAddresses(), ";"));

        //power data
        account.setPowerComsumerCategory(dto.getAccount().getPowerComsumerCategory());
        account.setPowerProvider(dto.getAccount().getPowerProvider());
        account.setSensitizationKit(dto.getAccount().getSensitizationKit());

        //save
        accountService.saveOrUpdate(account);

        //save data
        surveyController.saveSurvey(dto, account);

        //send email
        sendSummaryEmail(account);

        //save account into context
        securedController.storeIdentifier(account);

        //TODO return summary
        return ok(new SummaryDTO(accountToAccountDTOConverter.convert(account)));

    }

    private Result updateAccountAndSaveData() {

        if (!securedController.isAuthenticated()) {
            return securedController.onUnauthorized(ctx());
        }

        SurveyDTO dto = extractDTOFromRequest(SurveyDTO.class);

        //load user
        Account account = securedController.getCurrentUser();

        //current data
        account.setFirstName(dto.getAccount().getFirstName());
        account.setLastName(dto.getAccount().getLastName());
        account.setZipCode(dto.getAccount().getZipCode());
        account.setAccountType(getAccountTypeByString(dto.getAccount().getAccountType()));
        account.setOtherEmailAdresses(StringUtils.join(dto.getAccount().getOtherEmailAddresses(), ";"));

        //power data
        account.setPowerComsumerCategory(dto.getAccount().getPowerComsumerCategory());
        account.setPowerProvider(dto.getAccount().getPowerProvider());
        account.setSensitizationKit(dto.getAccount().getSensitizationKit());

        //save
        accountService.saveOrUpdate(account);

        //save data
        surveyController.saveSurvey(dto, account);

        //TODO TEMP send email
        sendSummaryEmail(account);

        //TODO return summary
        return ok(new SummaryDTO(accountToAccountDTOConverter.convert(account)));

    }


    private void sendSummaryEmail(Account account) {

        //create action list
        HashMap<TopicEnum, List<String>> actions = surveyService.getActions(account);

        Logger.error("actions:" + actions);

        //convert action to string
        String actionString = emailController.generateActionsTable(account);

        HashMap<EmailParams, String> paramsMap = new HashMap<>();

        for (EmailParams emailParams : EmailEnum.SUMMARY.getExpectedParams()) {
            if (emailParams.getName().equals("firstName")) {
                paramsMap.put(emailParams, account.getFirstName());
            } else if (emailParams.getName().equals("lastName")) {
                paramsMap.put(emailParams, account.getLastName());
            } else if (emailParams.getName().equals("reductionSum")) {
                // TODO
                paramsMap.put(emailParams, "0");
            } else if (emailParams.getName().equals("actionTable")) {
                paramsMap.put(emailParams, actionString);
            } else if (emailParams.getName().equals("personal_access_url")) {
                // TODO
                paramsMap.put(emailParams, "0");
            }
        }

        emailController.sendEmail(account.getEmail(), EmailEnum.SUMMARY, paramsMap);

    }

}
