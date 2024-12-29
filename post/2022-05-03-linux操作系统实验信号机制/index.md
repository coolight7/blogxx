---
title: "[linux操作系统实验]信号机制（按ctrl c给父进程发信号后，子进程没有反应？）"
date: "2022-05-03"
categories: 
  - "c"
  - "linux"
  - "操作系统实验"
tags: 
  - "c"
  - "kill"
  - "linux"
  - "shell"
  - "signal"
  - "操作系统"
---

## 问题

> 按ctrl c给父进程传信号后，父进程会发送信号给子进程，为什么子进程没有反应？
> 
> 而只有修改父进程给子进程发送的信号为SIGINT时才会有反应？

- **原因**：由于在shell中运行了父进程，父进程又创建了两个子进程，此时两个子进程和父进程是同一个进程组的，当我们在shell中按ctrl c时，会给前台进程组（即父进程和两个子进程）发送了SIGINT信号，此时父进程有对应SIGINT信号的自定义操作，但子进程并没有，因此子进程此时会执行这个信号默认的操作：结束进程。所以说，在我们按下ctrl c时，子进程已经结束了，此时父进程在给子进程发信号，但子进程已经死了，所以发的信号自然就没用了。
- 如果修改父进程给子进程发送的信号为SIGINT，就可以了吗？
    - 还是不太正确的
    - 因为在实验中，子进程收到信号后执行操作后就会结束进程。当我们按下ctrl c时，就已经发送了SIGINT信号给了子进程，子进程虽然此时会执行我们的自定义操作，输出信息，但之后就结束进程了。然后父进程才发信号过来给子进程，但子进程此时也是已经死了，所以父进程的信号依然是不起效果的。
- **解决办法**：
    
    - 可以让子进程忽略 ctrl c 即 SIGINT 信号，父进程依旧发送16 / 17信号
        - 在子进程中加一句 signal(SIGINT ,1); //忽略SIGINT信号
    
    - 可以另起一个会话窗口，先（$ ps -a ）找到父进程的pid，一般父进程是同名的三个进程中pid最小的那个，然后（$ kill -2 父进程pid）来单独给父进程发送SIGINT信号，这样就避免了一开始按 ctrl c 时子进程跟着父进程接收了SININT信号的问题。

* * *

## 实验具体内容

### 实验内容

- 编写程序：用fork( )创建两个子进程，再用系统调用signal( )让父进程捕捉键盘上来的中断信号（即按^c键）；捕捉到中断信号后，父进程用系统调用kill( )向两个子进程发出信号，子进程捕捉到信号后分别输出下列信息后终止：
    - Child process1 is killed by parent!
    - Child process2 is killed by parent!
    - 父进程等待两个子进程终止后，输出如下的信息后终止：
    - Parent process is killed!
- 分析利用软中断通信实现进程同步的机理

### 概念

#### 信号的基本概念

- 每个信号都对应一个正整数常量(称为signal  number,即信号编号。定义在系统头文件<signal.h>中)，代表同一用户的诸进程之间传送事先约定的信息的类型，用于通知某进程发生了某异常事件。每个进程在运行时，都要通过信号机制来检查是否有信号到达。若有，便中断正在执行的程序，转向与该信号相对应的处理程序，以完成对该事件的处理；处理结束后再返回到原来的断点继续执行。实质上，信号机制是对中断机制的一种模拟，故在早期的Linux版本中又把它称为软中断。
- 信号与中断的相似点：
    - （1）采用了相同的异步通信方式；
    - （2）当检测出有信号或中断请求时，都暂停正在执行的程序而转去执行相应的处理程序；
    - （3）都在处理完毕后返回到原来的断点；
    - （4）对信号或中断都可进行屏蔽。
- 信号与中断的区别：
    - （1）中断有优先级，而信号没有优先级，所有的信号都是平等的；
    - （2）信号处理程序是在用户态下运行的，而中断处理程序是在核心态下运行；
    - （3）中断响应是及时的，而信号响应通常都有较大的时间延迟。
- 信号机制具有以下三方面的功能：
    - （1）发送信号。发送信号的程序用系统调用kill( )实现；
    - （2）预置对信号的处理方式。接收信号的程序用signal( )来实现对处理方式的预置；
    - （3）收受信号的进程按事先的规定完成对相应事件的处理。

#### 信号的发送

- 信号的发送，是指由发送进程把信号送到指定进程的信号域的某一位上。如果目标进程正在一个可被中断的优先级上睡眠，核心便将它唤醒，发送进程就此结束。一个进程可能在其信号域中有多个位被置位，代表有多种类型的信号到达，但对于一类信号，进程却只能记住其中的某一个。
- 进程用kill( )向一个进程或一组进程发送一个信号。

#### 对信号的处理

- 当一个进程要进入或退出一个低优先级睡眠状态时，或一个进程即将从核心态返回用户态时，核心都要检查该进程是否已收到软中断。当进程处于核心态时，即使收到软中断也不予理睬；只有当它返回到用户态后，才处理软中断信号。对软中断信号的处理分三种情况进行：
    - （1）如果进程收到的软中断是一个已决定要忽略的信号（function=1），进程不做任何处理便立即返回；
    - （2）进程收到软中断后便退出（function=0）；
    - （3）执行用户设置的软中断处理程序。

### 涉及函数

#### **kill( )**

- 系统调用格式
    - int  kill(pid,sig)
- 参数定义
    - int  pid,sig;
- 其中，pid是一个或一组进程的标识符，参数sig是要发送的软中断信号
    - （1）pid>0时，核心将信号发送给进程pid
    - （2）pid=0时，核心将信号发送给与发送进程同组的所有进程
    - （3）pid=-1时，核心将信号发送给所有用户标识符真正等于发送进程的有效用户标识号的进程

#### **signal( )**

- 预置对信号的处理方式，允许调用进程控制软中断信号。
- 系统调用格式
    - signal(sig,function)
- 头文件为
    - #include <signal.h>
- 参数定义
    - signal(sig,function)
    - int  sig;
    - void (\*func) ( )
- 其中sig用于指定信号的类型，sig为0则表示没有收到任何信号，余者如下表：

<table><tbody><tr><td>值</td><td>名&nbsp;&nbsp;字</td><td>说&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;明</td></tr><tr><td>01</td><td>SIGHUP</td><td>挂起（hangup）</td></tr><tr><td>02</td><td>SIGINT</td><td>中断，当用户从键盘按^c键或^break键时</td></tr><tr><td>03</td><td>SIGQUIT</td><td>退出，当用户从键盘按quit键时</td></tr><tr><td>04</td><td>SIGILL</td><td>非法指令</td></tr><tr><td>05</td><td>SIGTRAP</td><td>跟踪陷阱（trace trap），启动进程，跟踪代码的执行</td></tr><tr><td>06</td><td>SIGIOT</td><td>IOT指令</td></tr><tr><td>07</td><td>SIGEMT</td><td>EMT指令</td></tr><tr><td>08</td><td>SIGFPE</td><td>浮点运算溢出</td></tr><tr><td>09</td><td>SIGKILL</td><td>杀死、终止进程&nbsp;</td></tr><tr><td>10</td><td>SIGBUS</td><td>总线错误</td></tr><tr><td>11</td><td>SIGSEGV</td><td>段违例（segmentation &nbsp;violation），进程试图去访问其虚地址空间以外的位置</td></tr><tr><td>12</td><td>SIGSYS</td><td>系统调用中参数错，如系统调用号非法</td></tr><tr><td>13</td><td>SIGPIPE</td><td>向某个非读管道中写入数据</td></tr><tr><td>14</td><td>SIGALRM</td><td>闹钟。当某进程希望在某时间后接收信号时发此信号</td></tr><tr><td>15</td><td>SIGTERM</td><td>软件终止（software &nbsp;termination）</td></tr><tr><td>16</td><td>SIGUSR1</td><td>用户自定义信号1</td></tr><tr><td>17</td><td>SIGUSR2</td><td>用户自定义信号2</td></tr><tr><td>18</td><td>SIGCLD</td><td>某个子进程死</td></tr><tr><td>19</td><td>SIGPWR</td><td>电源故障</td></tr></tbody></table>

- function：在该进程中的一个函数地址，在核心返回用户态时，它以软中断信号的序号作为参数调用该函数，对除了信号SIGKILL，SIGTRAP和SIGPWR以外的信号，核心自动地重新设置软中断信号处理程序的值为SIG\_DFL，一个进程**不能捕获SIGKILL信号**。
- function 的解释如下：
    - （1）function=1时，进程对sig类信号不予理睬，亦即屏蔽了该类信号；
    - （2）function=0时，缺省值，进程在收到sig信号后应终止自己；
    - （3）function为非0，非1类整数时，function的值即作为信号处理程序的指针。

### 源代码

```
#include <stdio.h>
#include <signal.h>
#include <unistd.h>
#include <iostream>
#include <sys/wait.h>
#include <sys/types.h>
using namespace std;

/*记录子进程pid,
 * whois：
 *      0：父进程
 *      1：子进程1
 *      2：子进程2*/
int pid1 = 0, pid2 = 0, whois = 0;

/*信号*/
#define COOLSIG SIGINT

/*响应信号*/
void do_exit(int)
{
        switch (whois)
        {
        case 0:
        {
                kill(pid1, COOLSIG);
                kill(pid2, COOLSIG);
                cout << "<< wait1: " << wait(0) << endl;
                cout << "<< wait2: " << wait(0) << endl;
                cout << "<< 父进程退出" << endl;
        }break;
        case 1:;
        case 2:
        {
                cout << "<< 子进程" << whois << "结束！" << endl;
        }break;
        }
        exit(0);
}

int main()
{
        cout << "<< COOLSIG = " << COOLSIG << endl;
        pid1 = fork();
        if (pid1 == -1){
                cout << "<< fork error" << endl;
        }
        else if (pid1 == 0)
        {
                 whois = 1;      //子进程1
                 signal(COOLSIG, do_exit);
        }
        else
        {
                cout << "pid1 = " << pid1 << endl;
                pid2 = fork();  //父进程
             	if (pid2 == -1)
                {
                        cout << "<< fork error" << endl;
                }
                else if (pid2 == 0)
                {
                        whois = 2;      //子进程2
                        signal(COOLSIG,do_exit);
                }
                else
                {
                        cout << "pid2 = " << pid2 << endl;
                        whois = 0;      //父进程
                        signal(SIGINT, do_exit);
                        cout << "<< 父进程等待 ctrl + C ..." << endl;
                }
        }
        while (1)
                usleep(100);
        cout << "<< 退出了，whois = " << whois << endl;
        return 0;
}
```

### 运行结果截图

![](images/image-9.png)

### 思考

- **本程序的预期结果为显示：**
    - **Child process1 is killed by parent!**
    - **Child process2 is killed by parent!**
    - **Parent process is killed!**
    - **预期的结果可以正确显示吗？如果不可以，程序该如何修改才能得到正确结果？**
- 不能，解决办法如下几种：
    - 可以把给子进程发送和接收的信号改为 SIGINT（此办法可以使输出正常，但父进程的发给子进程的信号并没有用到）
    - 可以让子进程忽略 ctrl c 即 SIGINT 信号，父进程依旧发送16 / 17信号
        - 在子进程中加一句 signal(SIGINT ,1);
    - 可以另起一个会话窗口，先（$ ps -a ）找到父进程的pid，然后使用命令（$ kill -2 父进程pid）来单独给父进程发送SIGINT信号，这样就避免了一开始按 ctrl c 时子进程跟着父进程接收了SININT信号的问题。
- **该程序段前面部分用了两个wait(0)，它们起什么作用？**
- 一个wait(0)只会让父进程等待一个子进程结束，而本实验中有2个子进程，使用两个wait(0)可以让父进程等待两个子进程全都结束后才输出并结束。
