package eu.factorx.citizens.controllers;

import eu.factorx.citizens.converter.AccountToAccountDTOConverter;
import eu.factorx.citizens.dto.AccountDTO;
import eu.factorx.citizens.dto.technical.ListDTO;
import eu.factorx.citizens.model.account.Account;
import eu.factorx.citizens.service.AccountService;
import eu.factorx.citizens.service.impl.AccountServiceImpl;
import play.mvc.Controller;
import play.mvc.Result;

/**
 * Created by florian on 20/11/14.
 */
public class AccountController extends Controller {

    //service
    private AccountService accountService = new AccountServiceImpl();
    //converter
    private AccountToAccountDTOConverter accountToAccountDTOConverter = new AccountToAccountDTOConverter();

    public Result get() {

        ListDTO<AccountDTO> result = new ListDTO<>();
        for (Account account : accountService.findAll()) {
            result.add(accountToAccountDTOConverter.convert(account));
        }

        return ok(result);
    }
}